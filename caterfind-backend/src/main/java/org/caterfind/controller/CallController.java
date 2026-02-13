package org.caterfind.controller;

import org.caterfind.dto.CallRequest;
import org.caterfind.service.CallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CallController {

    @Autowired
    private CallService callService;

    @PostMapping("/api/make-call")
    public ResponseEntity<String> makeCall(@RequestBody CallRequest req) {
        try {
            callService.makeCall(req.getTo(), req.getMessage());
            return ResponseEntity.ok("Call initiated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to initiate call: " + e.getMessage());
        }
    }
}
