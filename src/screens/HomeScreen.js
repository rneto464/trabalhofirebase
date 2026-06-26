import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../services/firebase';
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

export default function HomeScreen() {
  const [anuncios, setAnuncios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [usuarioFiltro, setUsuarioFiltro] = useState('Todos');

  async function buscarDados() {
    try {
      const snapAnuncios = await getDocs(
        query(collection(db, 'anuncios'), orderBy('createdAt', 'desc'))
      );
      const snapUsuarios = await getDocs(collection(db, 'usuarios'));
      setAnuncios(snapAnuncios.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsuarios(snapUsuarios.docs.map(d => d.data()));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      buscarDados();
    }, [])
  );

  function comprar() {
    window.alert('Tente novamente mais tarde');
  }

  const anunciosFiltrados = anuncios.filter(a => {
    const passaCategoria = categoriaAtiva === 'Todas' || a.categoria === categoriaAtiva;
    const passaUsuario = usuarioFiltro === 'Todos' || a.userName === usuarioFiltro;
    return passaCategoria && passaUsuario;
  });

  function renderCard({ item }) {
    return (
      <View style={styles.card}>
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

          <TouchableOpacity style={styles.btnComprar} onPress={comprar}>
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
              onRefresh={() => { setRefreshing(true); buscarDados(); }}
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
});
