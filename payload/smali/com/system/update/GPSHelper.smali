.class public Lcom/system/update/GPSHelper;
.super Ljava/lang/Object;
.source "GPSHelper.java"

.field private context:Landroid/content/Context;

.method public constructor <init>(Landroid/content/Context;)V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/system/update/GPSHelper;->context:Landroid/content/Context;
    return-void
.end method

.method public getLocation()Lorg/json/JSONObject;
    .locals 1
    new-instance v0, Lorg/json/JSONObject;
    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V
    return-object v0
.end method
