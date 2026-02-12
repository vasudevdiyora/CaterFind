package org.caterfind.dto;

public class ReorderRequest {
    private String dealerName;
    private String dealerPhone;
    private Long dealerContactId; // Optional: if linked
    private String messageText;

    // Constructors
    public ReorderRequest() {
    }

    public ReorderRequest(String dealerName, String dealerPhone, Long dealerContactId, String messageText) {
        this.dealerName = dealerName;
        this.dealerPhone = dealerPhone;
        this.dealerContactId = dealerContactId;
        this.messageText = messageText;
    }

    // Getters and Setters
    public String getDealerName() {
        return dealerName;
    }

    public void setDealerName(String dealerName) {
        this.dealerName = dealerName;
    }

    public String getDealerPhone() {
        return dealerPhone;
    }

    public void setDealerPhone(String dealerPhone) {
        this.dealerPhone = dealerPhone;
    }

    public Long getDealerContactId() {
        return dealerContactId;
    }

    public void setDealerContactId(Long dealerContactId) {
        this.dealerContactId = dealerContactId;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }
}
