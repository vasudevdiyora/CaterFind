package org.caterfind.service;

import org.caterfind.dto.DishDTO;
import org.caterfind.entity.Dish;
import org.caterfind.entity.User;
import org.caterfind.repository.DishRepository;
import org.caterfind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DishService {

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private UserRepository userRepository;

    public List<DishDTO> getDishesByUserId(Long userId) {
        return dishRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public DishDTO createDish(DishDTO dishDTO) {
        User user = userRepository.findById(dishDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Dish dish = new Dish();
        dish.setUser(user);
        dish.setName(dishDTO.getName());
        dish.setCategory(dishDTO.getCategory());
        dish.setImageUrl(dishDTO.getImageUrl());
        dish.setDescription(dishDTO.getDescription());
        dish.setType(dishDTO.getType());
        dish.setLabels(dishDTO.getLabels());

        Dish savedDish = dishRepository.save(dish);
        return convertToDTO(savedDish);
    }

    public DishDTO updateDish(Long id, DishDTO dishDTO) {
        Dish dish = dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dish not found"));

        dish.setName(dishDTO.getName());
        dish.setCategory(dishDTO.getCategory());
        dish.setImageUrl(dishDTO.getImageUrl());
        dish.setDescription(dishDTO.getDescription());
        dish.setType(dishDTO.getType());
        dish.setLabels(dishDTO.getLabels());

        Dish updatedDish = dishRepository.save(dish);
        return convertToDTO(updatedDish);
    }

    public void deleteDish(Long id) {
        dishRepository.deleteById(id);
    }

    private DishDTO convertToDTO(Dish dish) {
        DishDTO dto = new DishDTO();
        dto.setId(dish.getId());
        dto.setUserId(dish.getUser().getId());
        dto.setName(dish.getName());
        dto.setCategory(dish.getCategory());
        dto.setImageUrl(dish.getImageUrl());
        dto.setDescription(dish.getDescription());
        dto.setType(dish.getType());
        dto.setLabels(dish.getLabels());
        dto.setCreatedAt(dish.getCreatedAt());
        return dto;
    }
}
