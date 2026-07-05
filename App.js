import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Dimensions, Alert, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPACESHIP_WIDTH = 50;
const SPACESHIP_HEIGHT = 60;
const ASTEROID_SIZE = 45;

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  
  const [shipX, setShipX] = useState(SCREEN_WIDTH / 2 - SPACESHIP_WIDTH / 2);
  const [asteroidX, setAsteroidX] = useState(Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE - 40) + 20); // Kept inside borders
  const [asteroidY, setAsteroidY] = useState(-ASTEROID_SIZE);

  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const savedValue = await AsyncStorage.getItem('space_high_score');
      if (savedValue !== null) setHighScore(parseInt(savedValue, 10));
    } catch (error) {
      console.log("Failed to load high score:", error);
    }
  };

  const saveHighScore = async (newHighScore) => {
    try {
      await AsyncStorage.setItem('space_high_score', newHighScore.toString());
    } catch (error) {
      console.log("Failed to save high score:", error);
    }
  };

  const startGame = () => {
    setScore(0);
    setShipX(SCREEN_WIDTH / 2 - SPACESHIP_WIDTH / 2);
    setAsteroidY(-ASTEROID_SIZE);
    setAsteroidX(Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE - 40) + 20);
    setGameActive(true);
  };

  const triggerGameOver = () => {
    setGameActive(false);
    if (score > highScore) {
      setHighScore(score);
      saveHighScore(score);
      Alert.alert("SYSTEM OVERRIDE! 👾", `New High Score Registered:\n\nScore: ${score}`, [
        { text: "REBOOT", onPress: startGame }
      ]);
    } else {
      Alert.alert("HULL BREACH 💥", `Ship Destroyed.\n\nScore: ${score}\nBest: ${highScore}`, [
        { text: "REBOOT", onPress: startGame }
      ]);
    }
  };

  // Game Loop (requestAnimationFrame for precise 16ms/60fps execution)
  useEffect(() => {
    let animationFrameId;
    const gameLoop = () => {
      setAsteroidY((currentY) => {
        const nextY = currentY + 7; // Speed
        const spaceshipFixedY = SCREEN_HEIGHT - 260; // Adjusted for new arcade cabinet borders and layout

        // Collision Check (AABB Bounding Box)
        const hasCollided = 
          nextY + ASTEROID_SIZE >= spaceshipFixedY &&
          nextY <= spaceshipFixedY + SPACESHIP_HEIGHT &&
          asteroidX + ASTEROID_SIZE >= shipX &&
          asteroidX <= shipX + SPACESHIP_WIDTH;

        if (hasCollided) {
          triggerGameOver();
          return currentY;
        }

        // Point Cleared
        if (nextY > SCREEN_HEIGHT - 120) {
          setScore((prev) => prev + 1);
          setAsteroidX(Math.random() * (SCREEN_WIDTH - ASTEROID_SIZE - 40) + 20); 
          return -ASTEROID_SIZE; 
        }

        return nextY;
      });
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (gameActive) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameActive, asteroidX, shipX, score, highScore]);

  // Movement actions
  const moveLeft = () => { if (gameActive) setShipX((x) => Math.max(10, x - 35)); };
  const moveRight = () => { if (gameActive) setShipX((x) => Math.min(SCREEN_WIDTH - SPACESHIP_WIDTH - 10, x + 35)); };

  return (
    <LinearGradient colors={['#090514', '#1A0B2E', '#090514']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Cyberpunk HUD Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>CYBER RUNNER</Text>
        {!gameActive && <Text style={styles.subtitle}>SYSTEM OFFLINE - PRESS START</Text>}
      </View>

      {/* Glassmorphic Scoreboard */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>CURRENT SCORE</Text>
            <Text style={styles.scoreNumber}>{score}</Text>
          </View>
          <View style={[styles.scoreBlock, styles.highScoreBorder]}>
            <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
            <Text style={styles.highScoreNumber}>{highScore}</Text>
          </View>
        </View>
        
        {!gameActive && (
          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.7}>
            <LinearGradient colors={['#FF0055', '#990033']} style={styles.startButtonGradient}>
              <Text style={styles.startButtonText}>INITIATE LAUNCH</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Download App Button for Web */}
      {Platform.OS === 'web' && (
        <TouchableOpacity 
          style={styles.downloadButton} 
          onPress={() => Linking.openURL('https://expo.dev/accounts/rahulkalla/projects/SpaceRunnerGame/builds/5d22e888-0999-46a0-8901-a9cb2f92fd79')}
          activeOpacity={0.7}
        >
          <Text style={styles.downloadButtonText}>⬇ DOWNLOAD MOBILE APP</Text>
        </TouchableOpacity>
      )}

      {/* Arcade Cabinet Screen Area */}
      <View style={styles.arcadeCabinet}>
        <View style={styles.gameTrack}>
          {/* Asteroid */}
          <View style={[styles.asteroid, { left: asteroidX, top: asteroidY }]}>
            <View style={styles.asteroidCrater1} />
            <View style={styles.asteroidCrater2} />
            <View style={styles.asteroidCrater3} />
            <View style={styles.asteroidCore} />
          </View>

          {/* Spaceship */}
          <View style={[styles.spaceship, { left: shipX, bottom: 20 }]}>
            <View style={styles.thrusterFlameOuter}>
              <View style={styles.thrusterFlameInner} />
            </View>
            <View style={styles.shipWingLeft}>
               <View style={styles.blasterTip} />
            </View>
            <View style={styles.shipWingRight}>
               <View style={styles.blasterTip} />
            </View>
            <View style={styles.shipHull}>
               <View style={styles.cockpitGlow} />
            </View>
          </View>
        </View>
      </View>

      {/* Control Deck */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={moveLeft} disabled={!gameActive} activeOpacity={0.6}>
          <LinearGradient colors={['#00E5FF', '#007A8C']} style={styles.controlGradient}>
            <Text style={styles.controlButtonText}>« LEFT</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={moveRight} disabled={!gameActive} activeOpacity={0.6}>
          <LinearGradient colors={['#00E5FF', '#007A8C']} style={styles.controlGradient}>
            <Text style={styles.controlButtonText}>RIGHT »</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingBottom: 35,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#00E5FF',
    letterSpacing: 6,
    textShadowColor: '#00E5FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 12,
    color: '#FF0055',
    marginTop: 6,
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: '#FF0055',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scoreContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    width: '90%',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  scoreBlock: {
    alignItems: 'center',
    flex: 1,
  },
  highScoreBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#B0C4DE',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: '#00E5FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  highScoreLabel: {
    fontSize: 10,
    color: '#FF0055',
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  highScoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF0055',
    textShadowColor: '#FF0055',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  startButton: {
    width: '85%',
    marginTop: 18,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FF0055',
  },
  startButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  downloadButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#00E5FF',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  downloadButtonText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  arcadeCabinet: {
    flex: 1,
    width: '94%',
    marginVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  gameTrack: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  spaceship: {
    position: 'absolute',
    width: SPACESHIP_WIDTH,
    height: SPACESHIP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipHull: {
    width: 22,
    height: 45,
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: '#00E5FF',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  cockpitGlow: {
    width: 12,
    height: 18,
    backgroundColor: '#00FFFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  shipWingLeft: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    width: 20,
    height: 28,
    backgroundColor: '#0F0C29',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#FF0055',
    zIndex: 2,
    shadowColor: '#FF0055',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  shipWingRight: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    width: 20,
    height: 28,
    backgroundColor: '#0F0C29',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: '#FF0055',
    zIndex: 2,
    shadowColor: '#FF0055',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  blasterTip: {
    position: 'absolute',
    top: -4,
    left: 8,
    width: 4,
    height: 8,
    backgroundColor: '#00FFFF',
    borderRadius: 2,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  thrusterFlameOuter: {
    position: 'absolute',
    bottom: -18,
    width: 14,
    height: 24,
    backgroundColor: '#FF0055',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1,
    alignItems: 'center',
    shadowColor: '#FF0055',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  thrusterFlameInner: {
    width: 6,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: 2,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  asteroid: {
    position: 'absolute',
    width: ASTEROID_SIZE,
    height: ASTEROID_SIZE,
    backgroundColor: '#2A2A35',
    borderRadius: ASTEROID_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FF4500', 
    overflow: 'hidden',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  asteroidCore: {
    position: 'absolute',
    width: ASTEROID_SIZE - 12,
    height: ASTEROID_SIZE - 12,
    backgroundColor: '#1E1E26',
    borderRadius: (ASTEROID_SIZE - 12) / 2,
  },
  asteroidCrater1: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: '#111116',
    borderRadius: 7,
    top: 8,
    left: 8,
    zIndex: 2,
  },
  asteroidCrater2: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#111116',
    borderRadius: 4,
    bottom: 10,
    right: 10,
    zIndex: 2,
  },
  asteroidCrater3: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#111116',
    borderRadius: 5,
    top: 14,
    right: 6,
    zIndex: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 15,
  },
  controlButton: {
    width: '46%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  controlGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#090514',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
});