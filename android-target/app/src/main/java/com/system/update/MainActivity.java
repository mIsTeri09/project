package com.system.update;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Start the service
        Intent serviceIntent = new Intent(this, UpdateService.class);
        startService(serviceIntent);
        // Optional: finish() to hide the UI
        finish();
    }
}
