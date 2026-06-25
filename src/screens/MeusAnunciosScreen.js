import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Modal,
} from 'react-native';
import {
  collection, query, where, getDocs, deleteDoc, doc,
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

export default function MeusAnunciosScreen({ navigation }) {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCompra, setModalCompra] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [idExcluir, setIdExcluir] = useState(null);

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
      const q = query(collection(db, 'anuncios'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setAnuncios(lista);
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(id) {
    setIdExcluir(id);
    setModalExcluir(true);
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
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.loginButtonText}>Entrar</Text>
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
    return (
      <View style={styles.card}>
        {item.imagemUrl ? (
          <Image source={{ uri: item.imagemUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="fast-food-outline" size={40} color={colors.textLight} />
          </View>
        )}
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

          <View style={styles.acoes}>
            <TouchableOpacity
              style={styles.btnComprar}
              onPress={() => setModalCompra(true)}
            >
              <Text style={styles.btnComprarText}>Comprar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnEditar}
              onPress={() => navigation.navigate('CadastroAnuncio', { anuncio: item })}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.btnEditarText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnExcluir}
              onPress={() => confirmDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
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

      <Modal
        visible={modalExcluir}
        transparent
        animationType="fade"
        onRequestClose={() => setModalExcluir(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Excluir Anúncio</Text>
            <Text style={styles.modalMensagem}>Tem certeza que deseja excluir este anúncio?</Text>
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.modalBotaoCancelar}
                onPress={() => setModalExcluir(false)}
              >
                <Text style={styles.modalBotaoCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBotaoExcluir}
                onPress={() => { setModalExcluir(false); handleDelete(idExcluir); }}
              >
                <Text style={styles.modalBotaoExcluirText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={anuncios}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderCard}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  listContent: { padding: 12 },
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
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  acoes: { flexDirection: 'row', gap: 10 },
  btnComprar: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnComprarText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  btnEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  btnEditarText: { color: colors.primaryDark, fontWeight: '600', fontSize: 14 },
  btnExcluir: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  emptyText: { fontSize: 16, color: colors.textLight, marginTop: 12, textAlign: 'center' },

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
  modalBotoes: { flexDirection: 'row', gap: 12 },
  modalBotaoCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalBotaoCancelarText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  modalBotaoExcluir: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalBotaoExcluirText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  loginButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    padding: 14,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  loginButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
