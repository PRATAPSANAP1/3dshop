import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Platform, BackHandler, ActivityIndicator, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// The Live Production URL for the Frontend
const PRODUCTION_URL = 'https://3dshop-tawny.vercel.app';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; 
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  // Safety Timeout: If loading takes more than 15 seconds, allow manual bypass
  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't auto-hide, but we could show a "Skip" button if we wanted.
      // For now, let's just log it.
      console.log("Loading taking longer than expected...");
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setLoadProgress(0);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const skipLoading = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorMessage}>
              Unable to connect to the 3D Experience. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        {/* Enhanced Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.loadingTitle}>Initializing 3D World</Text>
              <Text style={styles.loadingSubtitle}>Optimizing assets for your device...</Text>
              
              {/* Progress indicator (optional but helpful) */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${loadProgress * 100}%` }]} />
              </View>

              {/* Manual bypass for slow connections */}
              {loadProgress > 0.1 && (
                <TouchableOpacity style={styles.skipButton} onPress={skipLoading}>
                  <Text style={styles.skipText}>Enter Store Anyway</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: PRODUCTION_URL }}
          style={[styles.webview, isLoading && { opacity: 0 }]}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          allowsBackForwardNavigationGestures={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          allowsFullscreenVideo={true}
          setSupportMultipleWindows={false}
          cacheEnabled={true}
          // Android specific performance
          {...(Platform.OS === 'android' && {
            androidLayerType: 'hardware',
            geolocationEnabled: true,
            mixedContentMode: 'always',
          })}
          // Event Handlers
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => {
            console.log("WebView Loading Started");
            setIsLoading(true);
          }}
          onLoadProgress={({ nativeEvent }) => {
            setLoadProgress(nativeEvent.progress);
            if (nativeEvent.progress === 1) {
              setIsLoading(false);
            }
          }}
          onLoad={() => {
            console.log("WebView Loading Finished");
            setIsLoading(false);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setHasError(true);
            setIsLoading(false);
          }}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 400) {
              console.warn('HTTP error: ', event.nativeEvent.statusCode);
              // Only set error for fatal status codes
              if (event.nativeEvent.statusCode >= 500) {
                setHasError(true);
              }
            }
          }}
          // Specific User Agent to identify mobile traffic if needed
          userAgent={`3DshopMobile/1.0.0 (${Platform.OS})`}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Matches the theme of 3Dshop
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundColor: '#0f172a', // Dark theme loading screen
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  loadingTitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '60%',
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#EA580C',
  },
  skipButton: {
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  skipText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0f172a',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

