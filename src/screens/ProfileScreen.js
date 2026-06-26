import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import colors from '../theme/colors';

const PRODUTOS_EXEMPLO = [
  {
    titulo: 'Marmita Fitness Frango Grelhado',
    descricao: 'Marmita saudável com frango grelhado, arroz integral, feijão carioca e mix de legumes no vapor. Ideal para quem busca uma alimentação equilibrada sem abrir mão do sabor. Porção de 500g.',
    preco: 18.90,
    categoria: 'Marmitas',
  },
  {
    titulo: 'Bolo de Cenoura com Chocolate',
    descricao: 'Bolo de cenoura fofinho com cobertura generosa de chocolate meio amargo. Feito artesanalmente com ingredientes frescos e sem conservantes. Serve até 10 fatias. Disponível para retirada ou entrega.',
    preco: 35.00,
    categoria: 'Bolos e Doces',
  },
  {
    titulo: 'Suco Verde Detox 500ml',
    descricao: 'Suco natural feito com couve, maçã verde, pepino, gengibre e limão. Sem adição de açúcar, conservantes ou corantes. Gelado e pronto para consumo. Produzido diariamente pela manhã.',
    preco: 12.00,
    categoria: 'Bebidas',
  },
  {
    titulo: 'Lasanha de Carne ao Molho Bolonhesa',
    descricao: 'Lasanha caseira com camadas generosas de carne moída temperada, molho de tomate especial, queijo mussarela e molho branco cremoso. Porção individual de 400g. Vai ao forno por 20 minutos.',
    preco: 25.50,
    categoria: 'Refeições',
  },
  {
    titulo: 'Brigadeiro Gourmet — Caixa com 12',
    descricao: 'Brigadeiros gourmet feitos com chocolate belga 70% cacau, creme de leite fresco e manteiga sem sal. Cobertura com granulado belga importado. Caixa decorada com 12 unidades. Ótimo presente.',
    preco: 28.00,
    categoria: 'Bolos e Doces',
  },
  {
    titulo: 'Frango Assado com Farofa',
    descricao: 'Frango inteiro marinado por 24 horas em temperos especiais: alho, limão, ervas finas, páprica defumada e azeite extra virgem. Assado lentamente para garantir suculência. Acompanha farofa da casa.',
    preco: 42.00,
    categoria: 'Refeições',
  },
];

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  async function handleSeed() {
    if (!auth.currentUser) return;
    setSeedLoading(true);
    try {
      for (const p of PRODUTOS_EXEMPLO) {
        await addDoc(collection(db, 'anuncios'), {
          ...p,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Usuário',
          createdAt: serverTimestamp(),
        });
      }
      Alert.alert('Sucesso', `${PRODUTOS_EXEMPLO.length} produtos de exemplo inseridos!`);
    } catch (error) {
      console.error('Erro ao inserir exemplos:', error);
      Alert.alert('Erro', 'Não foi possível inserir os produtos de exemplo.');
    } finally {
      setSeedLoading(false);
    }
  }

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch {
      Alert.alert('Erro', 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    navigation.navigate('Home');
  }

  if (user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color={colors.primaryDark} />
        </View>
        <Text style={styles.name}>{user.displayName || 'Usuário'}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('CadastroAnuncio')}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.primaryDark} />
          <Text style={styles.menuText}>Anunciar novo item</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('MeusAnuncios')}
        >
          <Ionicons name="list" size={22} color={colors.primaryDark} />
          <Text style={styles.menuText}>Ver meus anúncios</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.seedButton, seedLoading && styles.buttonDisabled]}
          onPress={handleSeed}
          disabled={seedLoading}
        >
          <Ionicons name="flask-outline" size={16} color={colors.textLight} />
          <Text style={styles.seedText}>
            {seedLoading ? 'Inserindo...' : 'Inserir produtos de exemplo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Entrar</Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          placeholder="Sua senha"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Aguarde...' : 'Entrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 12 },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  email: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginBottom: 32 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuText: { flex: 1, fontSize: 16, color: colors.text, marginLeft: 12 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 24,
  },
  logoutText: { color: colors.error, fontSize: 16, marginLeft: 8, fontWeight: '600' },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 24,
    textAlign: 'center',
  },
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
  button: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  link: {
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 10,
    gap: 6,
  },
  seedText: { fontSize: 13, color: colors.textLight },
});
