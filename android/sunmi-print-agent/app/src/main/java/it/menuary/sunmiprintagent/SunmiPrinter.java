package it.menuary.sunmiprintagent;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.os.RemoteException;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import woyou.aidlservice.jiuiv5.ICallback;
import woyou.aidlservice.jiuiv5.IWoyouService;

final class SunmiPrinter {
    private IWoyouService service;
    private boolean bound;
    private long lastBindAttemptMs;

    private final ServiceConnection connection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            service = IWoyouService.Stub.asInterface(binder);
            bound = true;
            try {
                service.printerInit(callback());
            } catch (RemoteException ignored) {
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            service = null;
            bound = false;
        }
    };

    void bind(Context context) {
        long now = System.currentTimeMillis();
        if (now - lastBindAttemptMs < 1_000) return;
        lastBindAttemptMs = now;
        if (bound) return;
        Intent intent = new Intent();
        intent.setPackage("woyou.aidlservice.jiuiv5");
        intent.setAction("woyou.aidlservice.jiuiv5.IWoyouService");
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE);
    }

    void unbind(Context context) {
        if (!bound) return;
        context.unbindService(connection);
        bound = false;
        service = null;
    }

    boolean isReady() {
        return service != null;
    }

    void print(byte[] data, int copies) throws RemoteException {
        if (service == null) throw new RemoteException("Servizio stampante SUNMI non connesso.");
        int repeat = Math.max(1, copies);
        for (int i = 0; i < repeat; i++) {
            PrintCallback cb = new PrintCallback();
            service.sendRAWData(data, cb);
            cb.await();
        }
    }

    private ICallback callback() {
        return new ICallback.Stub() {
            @Override public void onRunResult(boolean isSuccess) {}
            @Override public void onReturnString(String result) {}
            @Override public void onRaiseException(int code, String msg) {}
            @Override public void onPrintResult(int code, String msg) {}
        };
    }

    private static final class PrintCallback extends ICallback.Stub {
        private final CountDownLatch done = new CountDownLatch(1);
        private final AtomicReference<String> error = new AtomicReference<>(null);

        @Override public void onRunResult(boolean isSuccess) {
            if (!isSuccess) error.compareAndSet(null, "Comando stampa SUNMI rifiutato.");
            done.countDown();
        }

        @Override public void onReturnString(String result) {}

        @Override public void onRaiseException(int code, String msg) {
            error.compareAndSet(null, "SUNMI " + code + ": " + msg);
            done.countDown();
        }

        @Override public void onPrintResult(int code, String msg) {
            if (code != 0) error.compareAndSet(null, "SUNMI " + code + ": " + msg);
            done.countDown();
        }

        void await() throws RemoteException {
            try {
                if (!done.await(8, TimeUnit.SECONDS)) {
                    throw new RemoteException("Timeout risposta stampante SUNMI.");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RemoteException("Stampa interrotta.");
            }
            String message = error.get();
            if (message != null) throw new RemoteException(message);
        }
    }
}
