package woyou.aidlservice.jiuiv5;

import woyou.aidlservice.jiuiv5.ICallback;

interface IWoyouService {
    boolean postPrintData(String packageName, in byte[] data, int offset, int length);
    int getFirmwareStatus();
    String getServiceVersion();
    void printerInit(in ICallback callback);
    void printerSelfChecking(in ICallback callback);
    String getPrinterSerialNo();
    String getPrinterVersion();
    String getPrinterModal();
    void getPrintedLength(in ICallback callback);
    void lineWrap(int n, in ICallback callback);
    void sendRAWData(in byte[] data, in ICallback callback);
}
