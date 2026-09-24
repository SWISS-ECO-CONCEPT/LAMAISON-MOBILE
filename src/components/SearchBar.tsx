import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../config/theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  onSubmit?: () => void;
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder,
  onFilterPress,
  onSubmit,
}: SearchBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.inputWrap}>
        <MaterialIcons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? 'Rechercher…'}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')}>
            <MaterialIcons name="close" size={18} color={colors.textLight} />
          </Pressable>
        )}
      </View>
      {onFilterPress && (
        <Pressable style={styles.filterButton} onPress={onFilterPress}>
          <MaterialIcons name="tune" size={22} color={colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, padding: 0 },
  filterButton: {
    width: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});