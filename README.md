# SaborStore - Marketplace de Comidas

Aplicativo em React Native (Expo) que simula um marketplace de comidas, onde os
usuarios podem cadastrar, comprar (simulado) e gerenciar anuncios de alimentos.

Trabalho 2 - Programacao para Dispositivos Moveis 2026/1.

## Tecnologias

- React Native com Expo (SDK 56)
- React Navigation (native stack)
- Firebase Authentication (login e cadastro)
- Cloud Firestore (armazenamento dos anuncios e usuarios)
- Firebase Storage (fotos dos anuncios)

## Funcionalidades

Telas exigidas:
- Cabecalho com a logomarca ao centro e icone de perfil a direita em todas as telas
- Tela inicial com a lista de anuncios (nome, preco, usuario, data e hora,
  ate 3 linhas da descricao e botao "Comprar")
- Anuncios ordenados do mais novo para o mais antigo
- Filtro por usuario com a opcao "Todos" e mensagem "Nenhum anuncio encontrado"
- Tela de perfil: formulario de login (com caminho para o cadastro) quando
  deslogado; email e os botoes "Anunciar novo item", "Ver meus anuncios" e
  "Logout" quando logado
- Tela de cadastro de anuncio (titulo, descricao detalhada e preco)
- Tela "Ver meus anuncios" reutilizando o mesmo componente da lista

Pontos extras incluidos:
- Inclusao de fotos nos anuncios
- Excluir anuncios
- Editar anuncios
- Favoritar anuncios de outros usuarios

## Como rodar

1. Instale as dependencias:

```
npm install
```

2. Alinhe as versoes nativas com o SDK do Expo (importante, evita erros de
   compatibilidade):

```
npx expo install --fix
```

Se aparecer algum erro de versao no passo 1, rode direto o comando abaixo, que o
Expo resolve as versoes corretas automaticamente:

```
npx expo install expo-status-bar expo-image-picker @expo/vector-icons @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage @react-native-picker/picker firebase
```

3. Configure o Firebase (ver secao abaixo) e cole as credenciais no arquivo
   `firebaseConfig.js`.

4. Inicie o projeto:

```
npx expo start
```

Abra no Expo Go (celular) ou em um emulador.

## Configuracao do Firebase

1. Acesse https://console.firebase.google.com e crie um projeto.
2. Em **Authentication > Sign-in method**, ative **Email/senha**.
3. Em **Firestore Database**, crie o banco em modo de teste.
4. Em **Storage**, ative o armazenamento (necessario para as fotos).
5. Em **Configuracoes do projeto > Seus apps**, registre um app **Web** e copie
   o objeto de configuracao para o arquivo `firebaseConfig.js`.

Regras de teste do Firestore (apenas para desenvolvimento):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Regras de teste do Storage (apenas para desenvolvimento):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Estrutura

```
App.js                      navegacao e cabecalho
firebaseConfig.js           configuracao do Firebase
src/theme/colors.js         paleta de cores (tons pastel)
src/components/AnuncioCard.js  card de anuncio reutilizavel
src/screens/HomeScreen.js
src/screens/ProfileScreen.js
src/screens/RegisterScreen.js
src/screens/CadastroAnuncioScreen.js
src/screens/MeusAnunciosScreen.js
```
