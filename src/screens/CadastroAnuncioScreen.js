import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, storage } from '../services/firebase';
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
  const [imagemUri, setImagemUri] = useState(anuncio?.imagemUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [uploadProgresso, setUploadProgresso] = useState(0);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,   // comprime mais para upload mais rápido
      exif: false,
    });
    if (!result.canceled) {
      setImagemUri(result.assets[0].uri);
    }
  }

  function uploadImage(uri) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `anuncios/${auth.currentUser.uid}/${Date.now()}`);
        const task = uploadBytesResumable(storageRef, blob);

        task.on(
          'state_changed',
          snapshot => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgresso(pct);
          },
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  async function handleSubmit() {
    if (!titulo.trim() || !descricao.trim() || !preco.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      Alert.alert('Erro', 'Informe um preço válido.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Erro', 'Você precisa estar logado para publicar um anúncio.');
      return;
    }
    setLoading(true);
    setUploadProgresso(0);
    try {
      let imagemUrl = null;
      if (imagemUri) {
        imagemUrl = imagemUri.startsWith('http') ? imagemUri : await uploadImage(imagemUri);
      }

      if (editando) {
        await updateDoc(doc(db, 'anuncios', anuncio.id), {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          preco: precoNum,
          categoria,
          imagemUrl,
        });
        Alert.alert('Sucesso', 'Anúncio atualizado com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addDoc(collection(db, 'anuncios'), {
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          preco: precoNum,
          categoria,
          imagemUrl,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Usuário',
          createdAt: serverTimestamp(),
        });
        Alert.alert('Sucesso', 'Anúncio publicado com sucesso!', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível salvar o anúncio. Tente novamente.');
    } finally {
      setLoading(false);
      setUploadProgresso(0);
    }
  }

  const temImagemLocal = imagemUri && !imagemUri.startsWith('http');
  const labelBotao = loading
    ? temImagemLocal
      ? `Enviando foto… ${uploadProgresso}%`
      : 'Salvando…'
    : editando
    ? 'Salvar Alterações'
    : 'Publicar Anúncio';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Foto do Produto</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imagemUri ? (
            <Image source={{ uri: imagemUri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={36} color={colors.textLight} />
              <Text style={styles.imagePlaceholderText}>Adicionar foto</Text>
            </View>
          )}
        </TouchableOpacity>

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
              <Text
                style={[styles.categoriaText, categoria === cat && styles.categoriaTextAtiva]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && temImagemLocal && (
          <View style={styles.progressoContainer}>
            <View style={[styles.progressoBarra, { width: `${uploadProgresso}%` }]} />
          </View>
        )}

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 10 },
  imagePicker: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
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
  progressoContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressoBarra: {
    height: '100%',
    backgroundColor: colors.primaryDark,
    borderRadius: 3,
  },
  button: {
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
