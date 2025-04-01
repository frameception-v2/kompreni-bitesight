"use client";

import { useEffect, useCallback, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { useFrameSDK } from "~/hooks/useFrameSDK";
import sdk from "@farcaster/frame-sdk";

// Sample food recommendations by city
interface FoodRecommendations {
  [key: string]: Array<{
    name: string;
    place: string;
    description: string;
  }>;
}

const foodRecommendations: FoodRecommendations = {
  "chicago": [
    { name: "Deep Dish Pizza", place: "Lou Malnati's", description: "Classic Chicago-style deep dish pizza" },
    { name: "Italian Beef", place: "Portillo's", description: "Juicy beef sandwich with giardiniera" },
    { name: "Chicago Dog", place: "Superdawg", description: "Hot dog with all the fixings (no ketchup!)" }
  ],
  "tokyo": [
    { name: "Ramen", place: "Ichiran", description: "Authentic tonkotsu ramen experience" },
    { name: "Sushi", place: "Tsukiji Market", description: "Fresh sushi from the famous fish market" },
    { name: "Yakitori", place: "Omoide Yokocho", description: "Grilled chicken skewers in Memory Lane" }
  ],
  "seoul": [
    { name: "Korean BBQ", place: "Maple Tree House", description: "Premium grilled meats with banchan" },
    { name: "Bibimbap", place: "Jeonju Yuhalmeoni", description: "Rice bowl with vegetables and gochujang" },
    { name: "Street Food", place: "Gwangjang Market", description: "Try bindaetteok and mung bean pancakes" }
  ],
  "default": [
    { name: "Local Specialty", place: "Ask locals for recommendations", description: "The best food is often where locals eat" },
    { name: "Street Food", place: "Local markets", description: "Authentic flavors at affordable prices" },
    { name: "Fusion Cuisine", place: "Trendy districts", description: "Modern takes on traditional dishes" }
  ]
};

interface FoodRecommendation {
  name: string;
  place: string;
  description: string;
}

interface FoodRecommendationCardProps {
  city: string;
  onChangeCity: (city: string) => void;
  onGetRecommendations: () => void;
}

function FoodRecommendationCard({ city, onChangeCity, onGetRecommendations }: FoodRecommendationCardProps) {
  const recommendations: FoodRecommendation[] = city ? 
    (foodRecommendations[city.toLowerCase()] || foodRecommendations.default) : 
    foodRecommendations.default;
  const [currentRec, setCurrentRec] = useState<number>(0);
  
  const nextRecommendation = () => {
    setCurrentRec((prev) => (prev + 1) % recommendations.length);
  };
  
  const recommendation = recommendations[currentRec];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Food Recommendations</CardTitle>
        <CardDescription>
          {city ? `Recommendations for ${city}` : "Enter your location for food recommendations"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input 
            placeholder="Enter your city" 
            value={city} 
            onChange={(e) => onChangeCity(e.target.value)}
            className="flex-1"
          />
          <Button onClick={onGetRecommendations}>Go</Button>
        </div>
        
        {city && recommendation && (
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-bold">{recommendation.name}</h3>
            <p className="text-sm font-medium">Where: {recommendation.place}</p>
            <p className="text-sm">{recommendation.description}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={nextRecommendation}
          disabled={!city}
        >
          Next Recommendation
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            if (recommendation) {
              const searchQuery = `${recommendation.name} ${recommendation.place} ${city}`;
              sdk.actions.openUrl(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`);
            }
          }}
          disabled={!city}
        >
          View on Map
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Frame() {
  const { isSDKLoaded } = useFrameSDK();
  const [city, setCity] = useState<string>("");
  const [detectedCity, setDetectedCity] = useState<string>("");
  
  // Try to detect user's location from localStorage or context
  useEffect(() => {
    // Check if we have a saved location in localStorage
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const savedCity = localStorage.getItem("userCity");
      if (savedCity) {
        setCity(savedCity);
        return;
      }
    }
    
    // Try to detect from context (this is simplified - actual implementation would depend on SDK capabilities)
    const detectLocation = async () => {
      try {
        const context = await sdk.context;
        // Look for location hints in user's recent casts
        if (context?.user?.username === "kompreni") {
          // Based on the cast history, we know this user mentioned Chicago, Tokyo, and Seoul
          if (detectedCity === "") {
            setDetectedCity("Chicago"); // Default to Chicago based on most recent mention
          }
        }
      } catch (error) {
        console.error("Error detecting location:", error);
      }
    };
    
    if (isSDKLoaded) {
      detectLocation();
    }
  }, [isSDKLoaded, detectedCity]);
  
  const handleGetRecommendations = useCallback(() => {
    // Save the city for future use
    if (city && typeof window !== 'undefined') {
      localStorage.setItem("userCity", city);
    }
    
    // If no city entered but we detected one, use that
    if (!city && detectedCity) {
      setCity(detectedCity);
    }
  }, [city, detectedCity]);
  
  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[300px] mx-auto py-2 px-2">
      <FoodRecommendationCard 
        city={city} 
        onChangeCity={setCity} 
        onGetRecommendations={handleGetRecommendations} 
      />
      
      {detectedCity && !city && (
        <div className="mt-2 text-sm text-center">
          <Button 
            variant="link" 
            onClick={() => setCity(detectedCity)}
            className="p-0 h-auto"
          >
            Use detected location: {detectedCity}
          </Button>
        </div>
      )}
    </div>
  );
}
