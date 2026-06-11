package com.buildquietwealth.echelon;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "SmsReceiver",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS }
        )
    }
)
public class SmsReceiverPlugin extends Plugin {

    @PluginMethod
    public void getSmsPermissionState(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hasRead = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasReceive = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        if (hasRead && hasReceive) {
            ret.put("state", "granted");
        } else {
            ret.put("state", "denied");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        requestPermissionForAlias("sms", call, "smsPermissionCallback");
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hasRead = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasReceive = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        if (hasRead && hasReceive) {
            ret.put("state", "granted");
        } else {
            ret.put("state", "denied");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void readSmsInbox(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("READ_SMS permission not granted");
            return;
        }

        JSArray messagesList = new JSArray();
        Uri uri = Uri.parse("content://sms/inbox");
        ContentResolver cr = getContext().getContentResolver();
        
        try (Cursor cursor = cr.query(uri, new String[] { "_id", "address", "body", "date" }, null, null, "date DESC")) {
            if (cursor != null && cursor.moveToFirst()) {
                int count = 0;
                do {
                    String id = cursor.getString(0);
                    String address = cursor.getString(1);
                    String body = cursor.getString(2);
                    String date = cursor.getString(3);

                    // Check if contains banking/alert keywords to keep payload light & relevant
                    String bodyLower = body != null ? body.toLowerCase() : "";
                    boolean isTransaction = bodyLower.contains("spent") || 
                                           bodyLower.contains("debited") || 
                                           bodyLower.contains("credited") || 
                                           bodyLower.contains("transferred") || 
                                           bodyLower.contains("otp") || 
                                           bodyLower.contains("hdfc") || 
                                           bodyLower.contains("sbi") || 
                                           bodyLower.contains("icici") || 
                                           bodyLower.contains("axis") || 
                                           bodyLower.contains("txn") || 
                                           bodyLower.contains("payment") || 
                                           bodyLower.contains("alert") ||
                                           bodyLower.contains("₹") ||
                                           bodyLower.contains("rs.");

                    if (isTransaction) {
                        JSObject msg = new JSObject();
                        msg.put("id", "sms-native-" + id);
                        msg.put("address", address);
                        msg.put("body", body);
                        msg.put("date", date);
                        messagesList.put(msg);
                        count++;
                    }

                    if (count >= 50) { // Limit to 50 most recent banking transactions
                        break;
                    }
                } while (cursor.moveToNext());
            }
            
            JSObject response = new JSObject();
            response.put("messages", messagesList);
            call.resolve(response);
            
        } catch (Exception e) {
            call.reject("Failed to query SMS inbox: " + e.getMessage());
        }
    }
}
