import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Link, Clipboard as ClipboardIcon, Sparkles } from 'lucide-react-native';
import Button from './Button';
import ThemedAlert from './ThemedAlert';
import { useThemedAlert } from '@/hooks/useThemedAlert';

const { height: screenHeight } = Dimensions.get('window');

interface URLImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (url: string) => Promise<void>;
  isImporting: boolean;
}

export default function URLImportModal({
  visible,
  onClose,
  onImport,
  isImporting,
}: URLImportModalProps) {
  const [url, setUrl] = useState('');
  const [hasClipboardContent, setHasClipboardContent] = useState(false);
  const { alertState, showAlert, hideAlert } = useThemedAlert();

  // Check clipboard content when modal opens
  useEffect(() => {
    if (visible) {
      checkClipboard();
      setUrl('');
    }
  }, [visible]);

  const checkClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      const isValidUrl = clipboardContent && 
        (clipboardContent.startsWith('http://') || clipboardContent.startsWith('https://'));
      setHasClipboardContent(isValidUrl);
    } catch (error) {
      setHasClipboardContent(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        setUrl(clipboardContent);
      }
    } catch (error) {
      showAlert({
        title: 'Clipboard Error',
        message: 'Unable to access clipboard',
        type: 'error',
      });
    }
  };

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return urlString.startsWith('http://') || urlString.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    if (!url.trim()) {
      showAlert({
        title: 'Missing URL',
        message: 'Please enter a URL',
        type: 'warning',
      });
      return;
    }

    if (!validateUrl(url.trim())) {
      showAlert({
        title: 'Invalid URL',
        message: 'Please enter a valid URL (must start with http:// or https://)',
        type: 'warning',
      });
      return;
    }

    try {
      await onImport(url.trim());
      setUrl('');
      onClose();
    } catch (error) {
      showAlert({
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Failed to import recipe',
        type: 'error',
      });
    }
  };

  const handleClose = () => {
    setUrl('');
    onClose();
  };

  const supportedSites = [
    'YouTube', 'Pinterest', 'AllRecipes', 'Food Network',
    'Taste of Home', 'BBC Good Food', 'Food.com', 'Epicurious'
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Link size={24} color="#F97966" />
                </View>
                <Text style={styles.headerTitle}>Import Recipe</Text>
                <Text style={styles.headerSubtitle}>
                  Paste a link from your favorite recipe website and we'll automatically extract the recipe details for you.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
              {/* URL Input Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Recipe URL</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="https://example.com/recipe"
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="done"
                    onSubmitEditing={handleImport}
                    placeholderTextColor="#9CA3AF"
                    editable={!isImporting}
                  />
                  {hasClipboardContent && (
                    <TouchableOpacity
                      style={styles.pasteButton}
                      onPress={handlePasteFromClipboard}
                      disabled={isImporting}
                    >
                      <ClipboardIcon size={20} color="#F97966" />
                    </TouchableOpacity>
                  )}
                </View>

                {hasClipboardContent && !url && (
                  <TouchableOpacity
                    style={styles.clipboardSuggestion}
                    onPress={handlePasteFromClipboard}
                    disabled={isImporting}
                  >
                    <ClipboardIcon size={16} color="#F97966" />
                    <Text style={styles.clipboardSuggestionText}>
                      Paste from clipboard
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Supported Sites */}
              <View style={styles.supportedSection}>
                <View style={styles.supportedHeader}>
                  <Sparkles size={16} color="#F97966" />
                  <Text style={styles.supportedTitle}>Supported Sites</Text>
                </View>
                <View style={styles.supportedSites}>
                  {supportedSites.map((site, index) => (
                    <View key={site} style={styles.siteChip}>
                      <Text style={styles.siteChipText}>{site}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.supportedNote}>
                  We support most major recipe websites. If a site isn't supported, we'll do our best to extract what we can.
                </Text>
              </View>

              {/* How it Works */}
              <View style={styles.howItWorksSection}>
                <Text style={styles.howItWorksTitle}>How it works</Text>
                <View style={styles.stepsList}>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>Copy a recipe URL from any supported website</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>Paste it here and tap "Import Recipe"</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>We'll automatically extract ingredients, instructions, and more</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              style={styles.cancelButton}
              disabled={isImporting}
            />
            <Button
              title={isImporting ? "Importing..." : "Import Recipe"}
              onPress={handleImport}
              variant="primary"
              style={styles.importButton}
              disabled={isImporting || !url.trim()}
            />
          </View>
        </KeyboardAvoidingView>

        {/* Themed Alert */}
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          buttons={alertState.buttons}
          onClose={hideAlert}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
    paddingRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    gap: 32,
  },
  inputSection: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    paddingRight: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pasteButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboardSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F97966',
    gap: 8,
  },
  clipboardSuggestionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F97966',
  },
  supportedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  supportedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  supportedTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  supportedSites: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  siteChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  siteChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  supportedNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  howItWorksSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F97966',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
  },
  importButton: {
    flex: 2,
  },
});