package it.menuary.sunmiprintagent;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.os.RemoteException;

import woyou.aidlservice.jiuiv5.ICallback;
import woyou.aidlservice.jiuiv5.IWoyouService;

final class SunmiPrinter {
    private IWoyouService service;
    private boolean bound;

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
            service.sendRAWData(data, callback());
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
}
