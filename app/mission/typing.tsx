import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { alpha } from '@/src/utils/colors';
import { formatAlarmTime } from '@/src/utils/time';

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
type CharacterState = 'correct' | 'error' | 'pending' | 'current';

function pickPassage(length: PassageLength): string {
  const list = PASSAGES[length];
  return list[Math.floor(Math.random() * list.length)];
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

function getCharacterState(charIndex: number, typed: string): CharacterState {
  if (charIndex < typed.length) return 'error';
  if (charIndex === typed.length) return 'current';
  return 'pending';
}

function getCharacterDisplay(character: string, state: CharacterState, typedCharacter?: string): string {
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

export default function TypingMissionScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ passageLength: string; alarmId: string }>();

  const passageLength: PassageLength =
    params.passageLength === 'medium' || params.passageLength === 'long'
      ? params.passageLength
      : 'short';

  const [passage] = useState(() => pickPassage(passageLength));
  const [typed, setTyped] = useState('');
  const now = new Date();
  const [currentTime, setCurrentTime] = useState(formatAlarmTime(now.getHours(), now.getMinutes()));
  const [showSuccess, setShowSuccess] = useState(false);
  const completedRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setCurrentTime(formatAlarmTime(d.getHours(), d.getMinutes()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const onComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
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

  const characters = useMemo(() => Array.from(passage), [passage]);
  const typedCharacters = Array.from(typed);
  const progressPct = passage.length === 0
    ? 0
    : Math.round((Math.min(typed.length, passage.length) / passage.length) * 100);

  function focusInput() {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.topBar}>
          <Text style={[styles.topBarLabel, { color: colors.primaryDim }]}>MISSION ACTIVE</Text>
          <Text style={[styles.topBarTime, { color: colors.primaryDim }]}>{currentTime}</Text>
        </View>

        <Text style={[styles.heading, { color: colors.onSurface }]}>TYPE TO DISMISS</Text>

        <View style={styles.passagePressable} onTouchStart={focusInput}>
          <View
            style={[
              styles.passageContainer,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outlineVariant,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.passageText}>
              {characters.map((character, i) => {
                const state = getCharacterState(i, typed);
                const typedCharacter = typedCharacters[i];
                const isCorrect = typedCharacter === character;
                const pendingColor = alpha(colors.onSurfaceVariant, isDark ? '59' : '70');
                const color =
                  state === 'error' && !isCorrect
                    ? colors.error
                    : state === 'error' && isCorrect
                      ? colors.onSurface
                      : state === 'current'
                        ? pendingColor
                        : state === 'pending'
                          ? pendingColor
                          : colors.onSurface;

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
                      <Text style={[styles.caretOverlay, { color: colors.primary }]}>|</Text>
                    ) : null}
                    {getCharacterDisplay(character, state, typedCharacter)}
                  </Text>
                );
              })}
              {typedCharacters.length >= characters.length && (
                <Text style={[styles.characterSpan, styles.trailingCaretSlot]}>
                  <Text style={[styles.caretOverlay, { color: colors.primary }]}>|</Text>
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

        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerHighest }]}>
          <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: colors.primaryDim }]} />
        </View>

        <Pressable style={styles.keyboardHint} onPress={focusInput}>
          <MaterialIcons name="keyboard" size={28} color={colors.onSurfaceVariant} />
          <Text style={[styles.keyboardHintText, { color: colors.onSurfaceVariant }]}>Tap to type</Text>
        </Pressable>
      </KeyboardAvoidingView>

      {showSuccess && (
        <View style={[styles.modalOverlay, { backgroundColor: alpha(colors.background, isDark ? 'D9' : 'CC') }]}>
          <View
            style={[
              styles.modalPanel,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <MaterialIcons name="check-circle" size={64} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>MISSION SUCCESS</Text>
            <Text style={[styles.modalSubtitle, { color: colors.onSurfaceVariant }]}>Alarm Dismissed</Text>
            <View style={[styles.modalButton, { backgroundColor: colors.primaryDim }]}>
              <Text style={styles.modalButtonText}>Good Morning →</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
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
  },
  topBarTime: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 32,
  },
  passageContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
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
    fontWeight: '800',
    position: 'absolute',
    left: -1,
    top: 0,
  },
  progressTrack: {
    height: 4,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  keyboardHint: {
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  keyboardHintText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  inputOverlay: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    backgroundColor: 'transparent',
    opacity: 0.01,
    zIndex: 2,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPanel: {
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    marginHorizontal: 32,
    borderWidth: 1,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
