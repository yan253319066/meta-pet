package com.metapet.backend;

public class PetData {
    private String nftId;
    private String name;
    private String modelType; // e.g., "cat", "dog", "dragon"
    private String color;
    private int level;

    // Constructors
    public PetData() {
    }

    public PetData(String nftId, String name, String modelType, String color, int level) {
        this.nftId = nftId;
        this.name = name;
        this.modelType = modelType;
        this.color = color;
        this.level = level;
    }

    // Getters and Setters
    public String getNftId() {
        return nftId;
    }

    public void setNftId(String nftId) {
        this.nftId = nftId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getModelType() {
        return modelType;
    }

    public void setModelType(String modelType) {
        this.modelType = modelType;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    // toString() method (optional, but good for logging)
    @Override
    public String toString() {
        return "PetData{" +
                "nftId='" + nftId + '\'' +
                ", name='" + name + '\'' +
                ", modelType='" + modelType + '\'' +
                ", color='" + color + '\'' +
                ", level=" + level +
                '}';
    }
}
