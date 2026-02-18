package org.caterfind.service;

public interface VoiceCallService {
    /**
     * Initiate a voice call to the specified number with a message.
     * 
     * @param to      Recipient phone number
     * @param message Message to be spoken or action to be taken
     * @throws Exception if the call initiation fails
     */
    void makeCall(String to, String message) throws Exception;
}
