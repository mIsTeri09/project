package com.system.update;

import android.content.Context;

public class FileExplorer {
    private final Context context;
    public FileExplorer(Context context) {
        this.context = context;
    }
    public String list(String path) {
        android.util.Log.d("FileExplorer", "Listing path: " + path + " with context: " + context.getPackageName());
        return "[]";
    }
}
