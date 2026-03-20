package org.caterfind.service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.caterfind.entity.Contact;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class TranslationService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Value("${openai.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Translates text from source language to target language using OpenAI.
     */
    public String translate(String text,
                            Contact.Language source,
                            Contact.Language target) {

        if (source == target) {
            return text;
        }

        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        try {
            return callOpenAI(text, source, target);
        } catch (Exception e) {
            System.err.println("Translation failed: " + e.getMessage());
            e.printStackTrace();
            // Return original text if translation fails
            return text;
        }
    }

    /**
     * Calls OpenAI API to translate text.
     */
    private String callOpenAI(String text,
                             Contact.Language source,
                             Contact.Language target) throws Exception {

        String sourceLang = getLanguageName(source);
        String targetLang = getLanguageName(target);

        // Create the prompt for translation
        String prompt = String.format(
            "Translate the following text from %s to %s. " +
            "Provide ONLY the translation, no explanations or additional text:\n\n%s",
            sourceLang, targetLang, text
        );

        // Build request body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", 
            "You are a professional translator. Translate accurately and naturally. " +
            "Return only the translated text without any explanations.");
        messages.add(systemMessage);
        
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);
        
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.3);
        requestBody.put("max_tokens", 1000);

        // Set headers — explicitly request UTF-8 so non-Latin scripts (Hindi, Gujarati, etc.)
        // survive the HTTP response decoding. Spring's StringHttpMessageConverter defaults
        // to ISO-8859-1 when the Content-Type has no charset, which corrupts Unicode.
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // Receive as raw bytes and decode as UTF-8 to avoid ISO-8859-1 corruption
        ResponseEntity<byte[]> response = restTemplate.postForEntity(
            apiUrl,
            entity,
            byte[].class
        );

        // Parse response
        String responseBody = new String(response.getBody(), StandardCharsets.UTF_8);
        JsonNode responseJson = objectMapper.readTree(responseBody);
        String translatedText = responseJson
            .path("choices")
            .get(0)
            .path("message")
            .path("content")
            .asText()
            .trim();

        return translatedText.isEmpty() ? text : translatedText;
    }

    /**
     * Converts Language enum to human-readable language name.
     */
    private String getLanguageName(Contact.Language language) {
        switch (language) {
            case ENGLISH:
                return "English";
            case HINDI:
                return "Hindi";
            case GUJARATI:
                return "Gujarati";
            default:
                return "English";
        }
    }

    public Map<Long, String> batchTranslate(
            String text,
            Contact.Language sourceLanguage,
            Map<Long, Contact.Language> targetLanguages) {

        Map<Long, String> translations = new HashMap<>();

        for (Map.Entry<Long, Contact.Language> entry :
                targetLanguages.entrySet()) {

            translations.put(
                entry.getKey(),
                translate(text, sourceLanguage, entry.getValue())
            );
        }

        return translations;
    }
}