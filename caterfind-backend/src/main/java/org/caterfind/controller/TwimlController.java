package org.caterfind.controller;

import org.springframework.web.bind.annotation.*;

@RestController
public class TwimlController {

    @RequestMapping(value = "/twiml", method = { RequestMethod.GET, RequestMethod.POST }, produces = "application/xml")
    public String twiml(@RequestParam(required = false) String msg) {
        if (msg == null)
            msg = "Hello from SMS App";
        return "<Response><Say voice='alice'>" + msg + "</Say></Response>";
    }
}
