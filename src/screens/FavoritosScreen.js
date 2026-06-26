import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, Modal,
} from 'react-native';
import {
  collection, query, where, getDocs, doc, deleteDoc, setDoc, documentId,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../services/firebase';
import colors from '../theme/colors';

function formatarData(timestamp) {
  if (!timestamp) return '';
  const data = timestamp.toDate();
  return (
    data.toLocaleDateString('pt-BR') +
    ' às ' +
    data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function FavoritosScreen({ navigation }) {
  const [anuncios, setAnuncios] = useState([]);
  const [favoritos, setFavoritos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [modalCompra, setModalCompra] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchFavoritos();
    }, [])
  );

  async function fetchFavoritos() {
    const user = auth.currentUser;
    if (!user) {
      setAnuncios([]);
      setFavoritos(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const favSnapshot = await getDocs(
        query(collection(db, 'favoritos'), where('userId', '==', user.uid))
      );
      const ids = favSnapshot.docs.map(d => d.data().anuncioId);
      setFavoritos(new Set(ids));

      if (ids.length === 0) {
        setAnuncios([]);
        return;
      }

      // Firestore 'in' suporta até 30 itens por batch
      const batches = [];
      for (let i = 0; i < ids.length; i += 30) {
        batches.push(ids.slice(i, i + 30));
      }
      const results = await Promise.all(
        batches.map(batch =>
          getDocs(query(collection(db, 'anuncios'), where(documentId(), 'in', batch)))
        )
      );
      setAnuncios(results.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorito(anuncioId) {
    const user = auth.currentUser;
    if (!user) return;
    const favId = `${user.uid}_${anuncioId}`;
    const isFav = favoritos.has(anuncioId);

    // Remove otimisticamente da lista ao desfavoritar
    if (isFav) {
      setAnuncios(prev => prev.filter(a => a.id !== anuncioId));
      setFavoritos(prev => { const n = new Set(prev); n.delete(anuncioId); return n; });
    } else {
      setFavoritos(prev => { const n = new Set(prev); n.add(anuncioId); return n; });
    }

    try {
      if (isFav) {
        await deleteDoc(doc(db, 'favoritos', favId));
      } else {
        await setDoc(doc(db, 'favoritos', favId), { userId: user.uid, anuncioId });
      }
    } catch {
      // Reverte em caso de erro
      if (isFav) {
        setFavoritos(prev => { const n = new Set(prev); n.add(anuncioId); return n; });
        fetchFavoritos();
      } else {
        setFavoritos(prev => { const n = new Set(prev); n.delete(anuncioId); return n; });
      }
      Alert.alert('Erro', 'Não foi possível atualizar favoritos.');
    }
  }

  if (!auth.currentUser) {
    return (
      <View style={styles.centered}>
        <Ionicons name="heart-outline" size={64} color={colors.border} />
        <Text style={styles.emptyText}>Faça login para ver seus favoritos.</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.actionButtonText}>Entrar</Text>
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

  function renderCard({ item }) {
    const isFav = favoritos.has(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.cardImageContainer}>
          {item.imagemUrl ? (
            <Image source={{ uri: item.imagemUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="fast-food-outline" size={40} color={colors.textLight} />
            </View>
          )}
          <TouchableOpacity style={styles.favButton} onPress={() => toggleFavorito(item.id)}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={22}
              color={isFav ? '#E53935' : colors.white}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitulo} numberOfLines={1}>{item.titulo}</Text>
          <Text style={styles.cardDescricao} numberOfLines={3}>{item.descricao}</Text>

          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText}>
              <Ionicons name="person-outline" size={12} /> {item.userName}
            </Text>
            <Text style={styles.cardMetaText}>
              <Ionicons name="time-outline" size={12} /> {formatarData(item.createdAt)}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardPreco}>
              R$ {Number(item.preco).toFixed(2).replace('.', ',')}
            </Text>
            <Text style={styles.cardCategoria}>{item.categoria}</Text>
          </View>

          <TouchableOpacity
            style={styles.btnComprar}
            onPress={() => setModalCompra(true)}
          >
            <Text style={styles.btnComprarText}>Comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal
        visible={modalCompra}
        transparent
        animationType="fade"
        onRequestClose={() => setModalCompra(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="time-outline" size={36} color={colors.primaryDark} style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitulo}>Indisponível</Text>
            <Text style={styles.modalMensagem}>Tente novamente mais tarde</Text>
            <TouchableOpacity style={styles.modalBotao} onPress={() => setModalCompra(false)}>
              <Text style={styles.modalBotaoText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={anuncios}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.headerTitle}>Meus Favoritos</Text>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="heart-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>Você ainda não tem favoritos.</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.actionButtonText}>Explorar anúncios</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  listContent: { padding: 12 },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardImageContainer: { position: 'relative' },
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 6,
  },
  cardBody: { padding: 14 },
  cardTitulo: { fontSize: 17, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  cardDescricao: { fontSize: 14, color: colors.textLight, marginBottom: 10, lineHeight: 20 },
  cardMeta: { marginBottom: 10, gap: 2 },
  cardMetaText: { fontSize: 12, color: colors.textLight },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardPreco: { fontSize: 18, fontWeight: 'bold', color: colors.primaryDark },
  cardCategoria: {
    fontSize: 12,
    color: colors.white,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  btnComprar: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnComprarText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },

  emptyText: { fontSize: 16, color: colors.textLight, marginTop: 14, textAlign: 'center' },
  actionButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  actionButtonText: { color: colors.white, fontSize: 15, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 28,
    width: '80%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  modalMensagem: { fontSize: 15, color: colors.textLight, textAlign: 'center', marginBottom: 24 },
  modalBotao: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  modalBotaoText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
});
