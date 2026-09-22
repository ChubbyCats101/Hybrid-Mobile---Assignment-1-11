import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { TYPE_COLORS } from "../constants/typeColors";

type TypeFilterProps = {
  types: string[];
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  onClear: () => void;
};

export default function TypeFilter({
  types,
  selectedTypes,
  onToggleType,
  onClear,
}: TypeFilterProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const hasSelection = selectedTypes.length > 0;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.filterButton, hasSelection && styles.filterButtonActive]}
      >
        <Ionicons
          name="filter"
          size={16}
          color={hasSelection ? "#FFFFFF" : "#565A65"}
        />
        <Text
          style={[
            styles.filterButtonText,
            hasSelection && styles.filterButtonTextActive,
          ]}
        >
          {hasSelection ? `ประเภท (${selectedTypes.length})` : "เลือกประเภท"}
        </Text>
      </Pressable>

      {hasSelection && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="ล้างตัวกรองประเภททั้งหมด"
          onPress={onClear}
          hitSlop={8}
          style={styles.trashButton}
        >
          <Ionicons name="trash-outline" size={18} color="#D62828" />
        </Pressable>
      )}

      {selectedTypes.map((type) => (
        <Pressable
          key={type}
          onPress={() => onToggleType(type)}
          style={styles.selectedPill}
        >
          <Text style={styles.selectedPillText}>{type}</Text>
          <Ionicons name="close" size={12} color="#FFFFFF" />
        </Pressable>
      ))}

      {modalVisible && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>เลือกประเภท</Text>

              {hasSelection && (
                <Pressable onPress={onClear} style={styles.sheetClear}>
                  <Ionicons name="trash-outline" size={15} color="#D62828" />
                  <Text style={styles.sheetClearText}>ล้างทั้งหมด</Text>
                </Pressable>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.typeGrid}>
              {types.map((type) => {
                const selected = selectedTypes.includes(type);
                const color = TYPE_COLORS[type] ?? "#7B7F8C";

                return (
                  <Pressable
                    key={type}
                    onPress={() => onToggleType(type)}
                    style={[
                      styles.chip,
                      selected && {
                        backgroundColor: color,
                        borderColor: color,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: selected ? "#FFFFFF" : color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.selectedText,
                      ]}
                    >
                      {type}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>เสร็จสิ้น</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  selectedPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#252832",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  selectedPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  filterButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E1D8",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  filterButtonActive: {
    backgroundColor: "#252832",
    borderColor: "#252832",
  },
  filterButtonText: {
    color: "#565A65",
    fontSize: 13,
    fontWeight: "900",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  trashButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3D3D3",
    backgroundColor: "#FDEDED",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#00000055",
  },
  sheet: {
    maxHeight: "70%",
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  sheetHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: "#252832",
    fontSize: 18,
    fontWeight: "900",
  },
  sheetClear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sheetClearText: {
    color: "#D62828",
    fontSize: 13,
    fontWeight: "800",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E1D8",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  chipText: {
    color: "#565A65",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  doneButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#D62828",
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
