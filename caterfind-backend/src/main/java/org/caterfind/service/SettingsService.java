package org.caterfind.service;

import org.caterfind.repository.PlatformSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {

    @Autowired
    private PlatformSettingRepository platformSettingRepository;

    public boolean isEnabled(String key) {
        return platformSettingRepository.findBySettingKey(key)
                .map(setting -> setting.getSettingValue())
                .map(Boolean::parseBoolean)
                .orElse(false);
    }

    public int getNumber(String key, int defaultValue) {
        return platformSettingRepository.findBySettingKey(key)
                .map(setting -> {
                    try {
                        return Integer.parseInt(setting.getSettingValue());
                    } catch (NumberFormatException ignored) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }
}