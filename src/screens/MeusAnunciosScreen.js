import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import {
  collection, query, where, getDocs, orderBy, deleteDoc, doc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../services/firebase';
import colors from '../theme/colors';

export default function MeusAnunciosScreen({ navigation }) {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMeusAnuncios();
    }, [])
  );

  async function fetchMeusAnuncios() {
    const user = auth.currentUser;
    if (!user) {
      setAnuncios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, 'anuncios'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setAnuncios(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(id) {
    Alert.alert('Excluir Anúncio', 'Tem certeza que deseja excluir este anúncio?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => handleDelete(id) },
    ]);
  }

  async function handleDelete(id) {
    try {
      await deleteDoc(doc(db, 'anuncios', id));
      setAnuncios(prev => prev.filter(a => a.id !== id));
    } catch {
      Alert.alert('Erro', 'Não foi possível excluir o anúncio.');
    }
  }

  if (!auth.currentUser) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={60} color={colors.border} />
        <Text style={styles.emptyText}>Faça login para ver seus anúncios.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={anuncios}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Meus Anúncios</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CadastroAnuncio')}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Novo</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="file-tray-outline" size={60} color={colors.border} />
            <Text style={styles.emptyText}>Você ainda não tem anúncios.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imagemUrl ? (
              <Image source={{ uri: item.imagemUrl }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Ionicons name="fast-food-outline" size={32} color={colors.textLight} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitulo} numberOfLines={1}>{item.titulo}</Text>
              <Text style={styles.cardPreco}>
                R$ {Number(item.preco).toFixed(2).replace('.', ',')}
              </Text>
              <Text style={styles.cardCategoria}>{item.categoria}</Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  listContent: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: colors.white, fontWeight: '600', marginLeft: 4 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardImage: { width: 80, height: 80 },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, padding: 12 },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  cardPreco: { fontSize: 16, fontWeight: 'bold', color: colors.primaryDark, marginBottom: 2 },
  cardCategoria: { fontSize: 12, color: colors.textLight },
  deleteButton: { padding: 16 },
  emptyText: { fontSize: 16, color: colors.textLight, marginTop: 12, textAlign: 'center' },
  button: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    padding: 14,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
