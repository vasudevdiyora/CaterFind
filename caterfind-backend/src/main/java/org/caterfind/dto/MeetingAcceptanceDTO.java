package org.caterfind.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO for accepting a meeting request with optional meeting details.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class MeetingAcceptanceDTO {
    private String meetingDate; // ISO date yyyy-MM-dd
    private String meetingTime; // HH:mm
    private String meetingPlace; // text address or place
    private Double meetingLatitude;
    private Double meetingLongitude;

    public String getMeetingDate() {
        return meetingDate;
    }

    public void setMeetingDate(String meetingDate) {
        this.meetingDate = meetingDate;
    }

    public String getMeetingTime() {
        return meetingTime;
    }

    public void setMeetingTime(String meetingTime) {
        this.meetingTime = meetingTime;
    }

    public String getMeetingPlace() {
        return meetingPlace;
    }

    public void setMeetingPlace(String meetingPlace) {
        this.meetingPlace = meetingPlace;
    }

    public Double getMeetingLatitude() {
        return meetingLatitude;
    }

    public void setMeetingLatitude(Double meetingLatitude) {
        this.meetingLatitude = meetingLatitude;
    }

    public Double getMeetingLongitude() {
        return meetingLongitude;
    }

    public void setMeetingLongitude(Double meetingLongitude) {
        this.meetingLongitude = meetingLongitude;
    }
}
