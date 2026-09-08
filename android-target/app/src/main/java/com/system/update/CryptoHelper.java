package com.system.update;

import android.util.Base64;
import org.json.JSONObject;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;

public class CryptoHelper {
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final byte[] KEY = "9d6dbb97c457b9e99eca491da28977c8".getBytes(); // ganti dengan key dari server

    public JSONObject encrypt(JSONObject data) throws Exception {
        SecureRandom random = new SecureRandom();
        byte[] iv = new byte[16];
        random.nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        SecretKeySpec keySpec = new SecretKeySpec(KEY, "AES");
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
        byte[] encrypted = cipher.doFinal(data.toString().getBytes("UTF-8"));
        JSONObject result = new JSONObject();
        result.put("iv", Base64.encodeToString(iv, Base64.NO_WRAP));
        result.put("data", Base64.encodeToString(encrypted, Base64.NO_WRAP));
        return result;
    }

    public JSONObject decrypt(JSONObject encrypted) throws Exception {
        byte[] iv = Base64.decode(encrypted.getString("iv"), Base64.NO_WRAP);
        byte[] cipherText = Base64.decode(encrypted.getString("data"), Base64.NO_WRAP);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        SecretKeySpec keySpec = new SecretKeySpec(KEY, "AES");
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
        byte[] decrypted = cipher.doFinal(cipherText);
        return new JSONObject(new String(decrypted, "UTF-8"));
    }
}
