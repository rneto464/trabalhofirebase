import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl, ScrollView, Alert,
} from 'react-native';
import {
  collection, getDocs, query, orderBy, where, setDoc, deleteDoc, doc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../services/firebase';
import colors from '../theme/colors';

const CATEGORIAS = ['Todas', 'Refeições', 'Bolos e Doces', 'Bebidas', 'Marmitas', 'Outros'];

function formatarData(timestamp) {
  if (!timestamp) return '';
  const data = timestamp.toDate();
  return (
    data.toLocaleDateString('pt-BR') +
    ' às ' +
    data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function HomeScreen({ navigation }) {
  const [anuncios, setAnuncios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [usuarioFiltro, setUsuarioFiltro] = useState('Todos');
  const [user, setUser] = useState(null);
  const [favoritos, setFavoritos] = useState(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  async function fetchDados() {
    try {
      const [snapshotAnuncios, snapshotUsuarios] = await Promise.all([
        getDocs(query(collection(db, 'anuncios'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'usuarios')),
      ]);
      setAnuncios(snapshotAnuncios.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsuarios(snapshotUsuarios.docs.map(d => d.data()));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const favSnapshot = await getDocs(
          query(collection(db, 'favoritos'), where('userId', '==', currentUser.uid))
        );
        setFavoritos(new Set(favSnapshot.docs.map(d => d.data().anuncioId)));
      } catch {
        setFavoritos(new Set());
      }
    } else {
      setFavoritos(new Set());
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDados();
    }, [])
  );

  async function toggleFavorito(anuncioId) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Login necessário', 'Faça login para salvar favoritos.');
      return;
    }
    const favId = `${currentUser.uid}_${anuncioId}`;
    const isFav = favoritos.has(anuncioId);

    setFavoritos(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(anuncioId);
      else next.add(anuncioId);
      return next;
    });

    try {
      if (isFav) {
        await deleteDoc(doc(db, 'favoritos', favId));
      } else {
        await setDoc(doc(db, 'favoritos', favId), {
          userId: currentUser.uid,
          anuncioId,
        });
      }
    } catch {
      setFavoritos(prev => {
        const next = new Set(prev);
        if (isFav) next.add(anuncioId);
        else next.delete(anuncioId);
        return next;
      });
      Alert.alert('Erro', 'Não foi possível atualizar favoritos.');
    }
  }

  const anunciosFiltrados = anuncios.filter(a => {
    const passaCategoria = categoriaAtiva === 'Todas' || a.categoria === categoriaAtiva;
    const passaUsuario = usuarioFiltro === 'Todos' || a.userName === usuarioFiltro;
    return passaCategoria && passaUsuario;
  });

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
            <Text style={styles.cardVendedor}>
              <Ionicons name="person-outline" size={12} /> {item.userName}
            </Text>
            <Text style={styles.cardData}>
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
            onPress={() => window.alert('Tente novamente mais tarde')}
          >
            <Text style={styles.btnComprarText}>Comprar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const ListHeader = (
    <View>
      <Text style={styles.filtroLabel}>Filtrar por usuário</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtroContainer}
      >
        {['Todos', ...usuarios.map(u => u.nome)].map(nome => (
          <TouchableOpacity
            key={nome}
            style={[styles.filtroChip, usuarioFiltro === nome && styles.filtroChipAtivo]}
            onPress={() => setUsuarioFiltro(nome)}
          >
            <Text style={[styles.filtroText, usuarioFiltro === nome && styles.filtroTextAtivo]}>
              {nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriasContainer}
      >
        {CATEGORIAS.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoriaChip, categoriaAtiva === cat && styles.categoriaChipAtiva]}
            onPress={() => setCategoriaAtiva(cat)}
          >
            <Text style={[styles.categoriaText, categoriaAtiva === cat && styles.categoriaTextAtiva]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primaryDark} style={styles.loader} />
      ) : (
        <FlatList
          data={anunciosFiltrados}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDados(); }}
              colors={[colors.primaryDark]}
            />
          }
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="fast-food-outline" size={60} color={colors.border} />
              <Text style={styles.emptyText}>Nenhum anúncio encontrado</Text>
            </View>
          }
        />
      )}

      {user && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CadastroAnuncio')}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1 },
  listContent: { padding: 12 },

  filtroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtroContainer: { paddingBottom: 10, paddingHorizontal: 4 },
  filtroChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filtroChipAtivo: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filtroText: { fontSize: 13, color: colors.text },
  filtroTextAtivo: { color: colors.white, fontWeight: '600' },

  categoriasContainer: { paddingVertical: 4, paddingHorizontal: 4, paddingBottom: 12 },
  categoriaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoriaChipAtiva: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  categoriaText: { fontSize: 13, color: colors.text },
  categoriaTextAtiva: { color: colors.white, fontWeight: '600' },

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
  cardVendedor: { fontSize: 12, color: colors.textLight },
  cardData: { fontSize: 12, color: colors.textLight },
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

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textLight, marginTop: 16 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
