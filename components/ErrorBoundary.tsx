import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level error boundary. Catches render/lifecycle errors anywhere in the
 * tree and shows a friendly retry screen instead of a white crash. Styling is
 * self-contained (no theme context) so it works even if a provider is what
 * threw. "Try Again" clears the error and re-renders the subtree.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="alert-circle-outline" size={40} color="#3b82f6" />
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The app ran into an unexpected problem. Please try again.
        </Text>
        <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.85}>
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: moderateScale(20),
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: moderateScale(14),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 28,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
});
