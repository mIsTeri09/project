.class public Lcom/system/update/FileExplorer;
.super Ljava/lang/Object;
.source "FileExplorer.java"

.field private final context:Landroid/content/Context;

.method public constructor <init>(Landroid/content/Context;)V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/system/update/FileExplorer;->context:Landroid/content/Context;
    return-void
.end method

.method public list(Ljava/lang/String;)Ljava/lang/String;
    .locals 1
    const-string v0, "[]"
    return-object v0
.end method
