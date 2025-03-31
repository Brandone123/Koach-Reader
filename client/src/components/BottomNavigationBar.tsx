import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { BottomNavigation, Text } from "react-native-paper";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { StackNavigationProp } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { selectUser } from "../slices/authSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "../utils/theme";

type NavigationProp = StackNavigationProp<RootStackParamList>;
type IconProps = { color: string; size: number };

const BottomNavigationBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(2); // Home index par défaut
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector(selectUser);
  const [isVisible, setIsVisible] = useState(false);

  // Utiliser useNavigationState pour vérifier la route actuelle de façon sûre
  const currentRouteName = useNavigationState(
    (state) => state?.routes[state?.index]?.name
  );

  // Create local state for routes
  const [routes, setRoutes] = useState([
    {
      key: "leaderboard",
      title: t("common.leaderboard"),
      icon: "podium",
      focusedIcon: "podium-gold",
    },
    {
      key: "challenges",
      title: t("common.challenges"),
      icon: "target",
      focusedIcon: "target-variant",
    },
    {
      key: "home",
      title: t("common.home"),
      icon: "view-dashboard-outline",
      focusedIcon: "view-dashboard",
    },
    {
      key: "profile",
      title: t("common.profile"),
      icon: "account-cog-outline",
      focusedIcon: "account-cog",
    },
    {
      key: "stats",
      title: t("common.stats"),
      icon: "chart-box-outline",
      focusedIcon: "chart-box",
    },
  ]);

  // Mettre à jour la visibilité en fonction de la route actuelle
  useEffect(() => {
    // Si currentRouteName est exactement "Home", on affiche la barre
    setIsVisible(currentRouteName === "Home");
    
    // Réinitialiser l'index sur "Home" quand on est sur la page Home
    if (currentRouteName === "Home") {
      setIndex(2); // Index de "home" dans le tableau routes
    }
  }, [currentRouteName]);

  // Update routes when language changes
  useEffect(() => {
    setRoutes([
      {
        key: "leaderboard",
        title: t("common.leaderboard"),
        icon: "podium",
        focusedIcon: "podium-gold",
      },
      {
        key: "challenges",
        title: t("common.challenges"),
        icon: "target",
        focusedIcon: "target-variant",
      },
      {
        key: "home",
        title: t("common.home"),
        icon: "view-dashboard-outline",
        focusedIcon: "view-dashboard",
      },
      {
        key: "profile",
        title: t("common.profile"),
        icon: "account-cog-outline",
        focusedIcon: "account-cog",
      },
      {
        key: "stats",
        title: t("common.stats"),
        icon: "chart-box-outline",
        focusedIcon: "chart-box",
      },
    ]);
  }, [t, i18n.language]);

  // Si la barre n'est pas visible, ne pas rendre le composant
  if (!isVisible) {
    return null;
  }

  const isPremium = user?.isPremium || false;

  // Define empty component for each scene
  const renderEmptyScene = () => null;

  // Map the components to keys
  const renderScene = {
    leaderboard: renderEmptyScene,
    challenges: renderEmptyScene,
    home: renderEmptyScene,
    profile: renderEmptyScene,
    stats: renderEmptyScene,
  };

  const renderIcon = ({
    route,
    focused,
    color,
  }: {
    route: any;
    focused: boolean;
    color: string;
  }) => {
    const iconName = focused ? route.focusedIcon || route.icon : route.icon;

    return (
      <View style={styles.iconColumn}>
        <View
          style={focused ? styles.activeIconContainer : styles.iconContainer}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={focused ? 28 : 24}
            color={color}
          />
          {focused}
        </View>
        <Text
          style={[
            styles.labelText,
            { color: focused ? colors.primary : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {route.title}
        </Text>
      </View>
    );
  };

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);

    switch (routes[newIndex].key) {
      case "leaderboard":
        navigation.navigate("Leaderboard");
        break;
      case "challenges":
        navigation.navigate("Challenges");
        break;
      case "home":
        navigation.navigate("Home");
        break;
      case "profile":
        navigation.navigate("Profile");
        break;
      case "stats":
        navigation.navigate("Stats");
        break;
    }
  };

  const handleAddBook = () => {
    navigation.navigate("ReadingPlan", { bookId: "" });
  };

  // Si currentRouteName est exactement "Home", on retourne le composant de navigation
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={handleIndexChange}
          renderScene={BottomNavigation.SceneMap(renderScene)}
          barStyle={styles.bar}
          activeColor={colors.primary}
          inactiveColor={colors.textSecondary}
          labeled={false}
          shifting={false}
          renderIcon={renderIcon}
          sceneAnimationType="opacity"
          sceneAnimationEnabled={true}
          theme={{
            colors: {
              secondaryContainer: "transparent",
            },
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },
  barContainer: {
    position: "relative",
  },
  bar: {
    backgroundColor: "#FFFFFF",
    height: 80,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  fabContainer: {
    position: "absolute",
    alignSelf: "center",
    bottom: 30,
    zIndex: 1000,
  },
  fab: {
    backgroundColor: "#FF6B6B",
    borderRadius: 28,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconContainer: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  activeDot: {
    position: "absolute",
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  iconColumn: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
  },

  labelText: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 70,
  },
});

export default BottomNavigationBar;