import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
} from 'react-native';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import colors from '../theme/colors';

const CATEGORIAS = ['Refeições', 'Bolos e Doces', 'Bebidas', 'Marmitas', 'Outros'];

export default function CadastroAnuncioScreen({ navigation, route }) {
  const anuncio = route.params?.anuncio ?? null;
  const editando = anuncio !== null;

  const [titulo, setTitulo] = useState(anuncio?.titulo ?? '');
  const [descricao, setDescricao] = useState(anuncio?.descricao ?? '');
  const [preco, setPreco] = useState(
    anuncio?.preco != null ? String(anuncio.preco).replace('.', ',') : ''
  );
  const [categoria, setCategoria] = useState(anuncio?.categoria ?? 'Refeições');
  const [imagemUrl, setImagemUrl] = useState(anuncio?.imagemUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visivel: false, titulo: '', mensagem: '', onOk: null });

  const urlValida = imagemUrl.trim().startsWith('http');

  async function handleSubmit() {
    if (!titulo.trim() || !descricao.trim() || !preco.trim()) {
      setModal({ visivel: true, titulo: 'Erro', mensagem: 'Preencha todos os campos obrigatórios.', onOk: null });
      return;
    }
    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      setModal({ visivel: true, titulo: 'Erro', mensagem: 'Informe um preço válido.', onOk: null });
      return;
    }
    if (!auth.currentUser) {
      setModal({ visivel: true, titulo: 'Erro', mensagem: 'Você precisa estar logado para publicar um anúncio.', onOk: null });
      return;
    }
    setLoading(true);
    try {
      const dados = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        preco: precoNum,
        categoria,
        imagemUrl: urlValida ? imagemUrl.trim() : null,
      };

      if (editando) {
        await updateDoc(doc(db, 'anuncios', anuncio.id), dados);
        setModal({
          visivel: true,
          titulo: 'Sucesso',
          mensagem: 'Anúncio atualizado com sucesso!',
          onOk: () => navigation.goBack(),
        });
      } else {
        await addDoc(collection(db, 'anuncios'), {
          ...dados,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Usuário',
          createdAt: serverTimestamp(),
        });
        setModal({
          visivel: true,
          titulo: 'Sucesso',
          mensagem: 'Anúncio publicado com sucesso!',
          onOk: () => navigation.navigate('Home'),
        });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setModal({
        visivel: true,
        titulo: 'Erro',
        mensagem: 'Não foi possível salvar o anúncio. Tente novamente.',
        onOk: null,
      });
    } finally {
      setLoading(false);
    }
  }

  const labelBotao = loading ? 'Salvando…' : editando ? 'Salvar Alterações' : 'Publicar Anúncio';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Foto do Produto</Text>

        <View style={styles.imagePreviewBox}>
          {urlValida ? (
            <Image source={{ uri: imagemUrl.trim() }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={36} color={colors.textLight} />
              <Text style={styles.imagePlaceholderText}>Prévia da imagem</Text>
            </View>
          )}
        </View>

        <Text style={styles.label}>URL da imagem</Text>
        <TextInput
          style={styles.input}
          value={imagemUrl}
          onChangeText={setImagemUrl}
          placeholder="https://exemplo.com/foto.jpg"
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ex: Marmita fitness com frango"
          maxLength={80}
        />

        <Text style={styles.label}>Descrição *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descreva seu produto, ingredientes, tamanho, etc."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={400}
        />

        <Text style={styles.label}>Preço (R$) *</Text>
        <TextInput
          style={styles.input}
          value={preco}
          onChangeText={setPreco}
          placeholder="0,00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categoriasContainer}>
          {CATEGORIAS.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoriaChip, categoria === cat && styles.categoriaChipAtiva]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={[styles.categoriaText, categoria === cat && styles.categoriaTextAtiva]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>{labelBotao}</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>{labelBotao}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modal.visivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModal(m => ({ ...m, visivel: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>{modal.titulo}</Text>
            <Text style={styles.modalMensagem}>{modal.mensagem}</Text>
            <TouchableOpacity
              style={styles.modalBotao}
              onPress={() => {
                setModal(m => ({ ...m, visivel: false }));
                modal.onOk?.();
              }}
            >
              <Text style={styles.modalBotaoText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 10 },
  imagePreviewBox: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imagePreview: { width: '100%', height: 200 },
  imagePlaceholder: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  imagePlaceholderText: { color: colors.textLight, marginTop: 8, fontSize: 14 },
  label: { fontSize: 14, color: colors.text, marginBottom: 4, fontWeight: '600' },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: colors.text,
  },
  textarea: { height: 100 },
  categoriasContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  categoriaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  categoriaChipAtiva: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  categoriaText: { fontSize: 13, color: colors.text },
  categoriaTextAtiva: { color: colors.white, fontWeight: '600' },
  button: {
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
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
