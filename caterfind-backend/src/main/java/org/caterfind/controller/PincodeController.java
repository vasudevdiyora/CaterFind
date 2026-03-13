package org.caterfind.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/utils")
@CrossOrigin(origins = "*")
public class PincodeController {

    private static final Logger logger = LoggerFactory.getLogger(PincodeController.class);

    @GetMapping("/pincode/{pincode}")
    public ResponseEntity<Map<String, Object>> lookupPincode(@PathVariable String pincode) {
        if (pincode == null || !pincode.matches("^\\d{6}$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid pincode"));
        }

        try {
            RestTemplate rest = new RestTemplate();
            String url = "https://api.postalpincode.in/pincode/" + pincode;
            ResponseEntity<String> resp = rest.getForEntity(url, String.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                logger.warn("Upstream pincode API returned non-2xx for {}: {}", pincode, resp.getStatusCode());
                return ResponseEntity.status(502).body(Map.of("success", false, "message", "Upstream lookup failed"));
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(resp.getBody());

            if (root.isArray() && root.size() > 0) {
                JsonNode first = root.get(0);
                String status = first.path("Status").asText(null);
                JsonNode postOffices = first.path("PostOffice");

                if ("Success".equalsIgnoreCase(status) && postOffices.isArray() && postOffices.size() > 0) {
                    JsonNode firstPo = postOffices.get(0);
                    String state = firstPo.path("State").asText("");
                    String district = firstPo.path("District").asText("");

                    List<String> postOfficeNames = new ArrayList<>();
                    for (JsonNode po : postOffices) {
                        postOfficeNames.add(po.path("Name").asText(""));
                    }

                    Map<String, Object> body = new HashMap<>();
                    body.put("success", true);
                    body.put("state", state);
                    body.put("district", district);
                    body.put("postOffices", postOfficeNames);
                    return ResponseEntity.ok(body);
                }
            }

            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Pincode not found"));
        } catch (Exception e) {
            logger.error("Pincode lookup error for {}: {}", pincode, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lookup failed: " + e.getMessage()));
        }
    }

}
