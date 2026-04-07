import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/src/hooks/useTheme';

// ---------------------------------------------------------------------------
// Passage library
// ---------------------------------------------------------------------------
const PASSAGES = {
  short: [
    'The early bird catches the worm.',
    'Rise and shine, the day is yours.',
    'Good morning, make it count today.',
  ],
  medium: [
    "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
    'In the middle of every difficulty lies opportunity. Wake up and seize the day with purpose.',
    'Each morning we are born again. What we do today matters most. Make it extraordinary.',
  ],
  long: [
    'The secret of getting ahead is getting started. Wake up, stand up, and start the day with intention. Every great achievement begins with the decision to try.',
    'Success is not final, failure is not fatal: it is the courage to continue that counts. Rise from your sleep and face the day with determination and grace.',
    'Morning is an important time of day because how you spend your morning can often tell you what kind of day you are going to have. Choose greatness.',
  ],
} as const;

type PassageLength = keyof typeof PASSAGES;

function pickPassage(length: PassageLength): string {
  const list = PASSAGES[length];
  return list[Math.floor(Math.random() * list.length)];
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function accuracy(typed: string, passage: string): number {
  const source = typed.trimEnd();
  const target = passage.trimEnd();
  const rows = source.length + 1;
  const cols = target.length + 1;

  if (rows === 1 && cols === 1) return 1;

  const dp = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      if (row === 0) return col;
      if (col === 0) return row;
      return 0;
    }),
  );

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const substitutionCost = source[row - 1] === target[col - 1] ? 0 : 1;
      dp[row][col] = Math.min(
        dp[row - 1][col] + 1,
        dp[row][col - 1] + 1,
        dp[row - 1][col - 1] + substitutionCost,
      );
    }
  }

  const distance = dp[rows - 1][cols - 1];
  const maxLength = Math.max(source.length, target.length);

  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

// ---------------------------------------------------------------------------
// Character state helpers
// ---------------------------------------------------------------------------
type CharacterState = 'correct' | 'error' | 'pending' | 'current';

function getCharacterState(charIndex: number, typed: string): CharacterState {
  if (charIndex < typed.length) {
    return 'error';
  }
  if (charIndex === typed.length) return 'current';
  return 'pending';
}

function getCharacterDisplay(
  character: string,
  state: CharacterState,
  typedCharacter?: string,
): string {
  if (character === ' ') {
    if (state === 'error') {
      return typedCharacter === ' ' ? ' ' : '_';
    }
    return ' ';
  }
  if (character === '\n') return '↵';
  if (character === '\t') return '⇥';
  return character;
}

// ---------------------------------------------------------------------------
// Color tokens (always dark)
// ---------------------------------------------------------------------------
const BG = '#0E0E0E';
const SURFACE = '#1A1919';
const SURFACE_HIGH = '#262626';
const PRIMARY = '#A8A4FF';
const PRIMARY_DIM = '#675DF9';
const ON_SURFACE = '#FFFFFF';
const ON_SURFACE_VARIANT = '#ADAAAA';
const ERROR_COLOR = '#FF6E84';
const SUCCESS_COLOR = '#2ED573';
const OUTLINE_VARIANT = '#484847';
const PENDING_COLOR = 'rgba(173,170,170,0.35)';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TypingMissionScreen() {
  useTheme(); // ensure theme context is available

  const router = useRouter();
  const params = useLocalSearchParams<{ passageLength: string; alarmId: string }>();

  const passageLength: PassageLength =
    params.passageLength === 'medium' || params.passageLength === 'long'
      ? params.passageLength
      : 'short';

  const [passage] = useState(() => pickPassage(passageLength));
  const [typed, setTyped] = useState('');
  const [currentTime, setCurrentTime] = useState(formatTime(new Date()));
  const [showSuccess, setShowSuccess] = useState(false);
  const completedRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  // Completion check
  const onComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    // TODO: notify alarm service
    setShowSuccess(true);
    setTimeout(() => router.back(), 1500);
  }, [router]);

  const handleChangeText = useCallback(
    (text: string) => {
      setTyped(text);
      const trimmedTyped = text.trimEnd();
      const trimmedPassage = passage.trimEnd();
      if (
        trimmedTyped === trimmedPassage ||
        (text.length >= passage.length && accuracy(text, passage) >= 0.95)
      ) {
        onComplete();
      }
    },
    [passage, onComplete],
  );

  const characters = Array.from(passage);
  const typedCharacters = Array.from(typed);
  const progressPct = passage.length === 0
    ? 0
    : Math.round((Math.min(typedCharacters.length, characters.length) / characters.length) * 100);

  function focusInput() {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarLabel}>MISSION ACTIVE</Text>
          <Text style={styles.topBarTime}>{currentTime}</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>TYPE TO DISMISS</Text>

        {/* Passage display */}
        <View style={styles.passagePressable} onTouchStart={focusInput}>
          <View style={styles.passageContainer} pointerEvents="none">
            <Text style={styles.passageText}>
              {characters.map((character, i) => {
                const state = getCharacterState(i, typed);
                const typedCharacter = typedCharacters[i];
                const isCorrect = typedCharacter === character;
                const color =
                  state === 'error' && !isCorrect
                    ? ERROR_COLOR
                    : state === 'error' && isCorrect
                      ? ON_SURFACE
                      : state === 'current'
                        ? PENDING_COLOR
                        : state === 'pending'
                          ? PENDING_COLOR
                          : ON_SURFACE;
                return (
                  <Text
                    key={i}
                    style={[
                      styles.characterSpan,
                      character === ' ' && styles.spaceSpan,
                      state === 'current' && styles.currentCharacterSpan,
                      { color },
                    ]}
                  >
                    {state === 'current' ? (
                      <Text style={styles.caretOverlay}>|</Text>
                    ) : null}
                    {getCharacterDisplay(character, state, typedCharacter)}
                  </Text>
                );
              })}
              {typedCharacters.length >= characters.length && (
                <Text style={[styles.characterSpan, styles.trailingCaretSlot]}>
                  <Text style={styles.caretOverlay}>|</Text>
                  {' '}
                </Text>
              )}
            </Text>
          </View>
          <TextInput
            ref={inputRef}
            value={typed}
            onChangeText={handleChangeText}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            showSoftInputOnFocus
            multiline={false}
            caretHidden
            contextMenuHidden
            selectionColor="transparent"
            underlineColorAndroid="transparent"
            style={styles.inputOverlay}
            accessibilityLabel="Type the passage here"
          />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPct}%`,
              },
            ]}
          />
        </View>

        {/* Keyboard icon hint */}
        <Pressable style={styles.keyboardHint} onPress={focusInput}>
          <MaterialIcons name="keyboard" size={28} color={ON_SURFACE_VARIANT} />
          <Text style={styles.keyboardHintText}>Tap to type</Text>
        </Pressable>
      </KeyboardAvoidingView>

      {/* Hidden input — captures all typing */}
      {/* Success modal */}
      {showSuccess && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <MaterialIcons name="check-circle" size={64} color={PRIMARY} />
            <Text style={styles.modalTitle}>MISSION SUCCESS</Text>
            <Text style={styles.modalSubtitle}>Alarm Dismissed</Text>
            <View style={styles.modalButton}>
              <Text style={styles.modalButtonText}>Good Morning →</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: {
    flex: 1,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  topBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: PRIMARY_DIM,
  },
  topBarTime: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: PRIMARY_DIM,
  },

  // Heading
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: ON_SURFACE,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 32,
  },

  // Passage
  passageContainer: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
  },
  passagePressable: {
    borderRadius: 16,
    marginHorizontal: 24,
    position: 'relative',
  },
  passageText: {
    fontSize: 22,
    lineHeight: 36,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  characterSpan: {
    fontSize: 22,
    lineHeight: 36,
    fontWeight: '600',
  },
  currentCharacterSpan: {
    position: 'relative',
  },
  trailingCaretSlot: {
    position: 'relative',
  },
  spaceSpan: {
    letterSpacing: 1,
  },
  caretOverlay: {
    color: PRIMARY,
    fontWeight: '800',
    position: 'absolute',
    left: -1,
    top: 0,
  },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: SURFACE_HIGH,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY_DIM,
    borderRadius: 2,
  },

  // Keyboard hint
  keyboardHint: {
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  keyboardHintText: {
    fontSize: 13,
    color: ON_SURFACE_VARIANT,
    letterSpacing: 0.5,
  },

  inputOverlay: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    backgroundColor: 'transparent',
    opacity: 0.01,
    zIndex: 2,
  },

  // Success modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14,14,14,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPanel: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: OUTLINE_VARIANT,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ON_SURFACE,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: ON_SURFACE_VARIANT,
    fontWeight: '500',
  },
  modalButton: {
    marginTop: 16,
    backgroundColor: PRIMARY_DIM,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  modalButtonText: {
    color: ON_SURFACE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
