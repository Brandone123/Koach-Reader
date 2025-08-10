import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  Share,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import * as Contacts from 'expo-contacts';
import { useTranslation } from 'react-i18next';
import { selectUser, logout } from '../slices/authSlice';
import { useSelector, useDispatch } from 'react-redux';

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: { number: string }[];
}

interface Friend {
  id: number;
  name: string;
  subtitle: string;
  avatar: string;
  following: boolean;
}

interface AddFriendsScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'AddFriends'>;
}

const AddFriendsScreen: React.FC<AddFriendsScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const user = useSelector(selectUser); // Déplacer ici
  const [searchText, setSearchText] = useState('');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const friendSuggestions = [
    { id: 1, name: 'Sara empavy', subtitle: t('addFriends.followsYou'), avatar: 'https://randomuser.me/api/portraits/women/1.jpg', following: false },
    { id: 2, name: 'june', subtitle: t('addFriends.followsYou'), avatar: 'https://randomuser.me/api/portraits/women/2.jpg', following: false },
    { id: 3, name: 'Ephraïm Takoua', subtitle: t('addFriends.followsYou'), avatar: 'https://randomuser.me/api/portraits/men/3.jpg', following: false },
    { id: 4, name: 'Michel Leundjie...', subtitle: t('addFriends.followsYou'), avatar: 'https://randomuser.me/api/portraits/men/4.jpg', following: false },
    { id: 5, name: 'Herman Diabaté', subtitle: t('addFriends.followsYou'), avatar: 'https://randomuser.me/api/portraits/men/5.jpg', following: false },
    { id: 6, name: 'Flosy Djach', subtitle: t('addFriends.followsYou'), avatar: 'https://randomuser.me/api/portraits/women/6.jpg', following: false },
    { id: 7, name: 'RAHIM', subtitle: t('addFriends.followsYou'), avatar: 'https://randomuser.me/api/portraits/men/7.jpg', following: false },
    { id: 8, name: 'Djeuko glyph', subtitle: t('addFriends.followsYou'), avatar: 'https://randomuser.me/api/portraits/women/8.jpg', following: false },
  ];

  const [suggestions, setSuggestions] = useState(friendSuggestions);

  const handleFollow = (id: number) => {
    setSuggestions(prev => 
      prev.map(person => 
        person.id === id ? { ...person, following: !person.following } : person
      )
    );
  };

  const handleDismiss = (id: number) => {
    setSuggestions(prev => prev.filter(person => person.id !== id));
  };

  const handleSearchContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });
        
        if (data.length > 0) {
          const formattedContacts = data
            .filter(contact => contact.name)
            .map(contact => ({
              id: contact.id || Math.random().toString(),
              name: contact.name || t('addFriends.contactNoName'),
              phoneNumbers: contact.phoneNumbers || []
            }));
          
          setContacts(formattedContacts);
          setShowContactsModal(true);
        } else {
          Alert.alert(t('addFriends.noContactsFound'), t('addFriends.noContactsFoundMessage'));
        }
      } else {
        Alert.alert(t('addFriends.permissionDenied'), t('addFriends.permissionDeniedMessage'));
      }
    } catch (error) {
      console.error('Erreur contacts:', error);
      Alert.alert(t('common.errorText'), t('addFriends.contactsAccessError'));
    }
  };

  const handleSearchByName = () => {
    setShowSearchModal(true);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Fonction de recherche optimisée avec debounce
  const performSearch = async (query: string) => {
    // Toujours mettre à jour le texte immédiatement
    setSearchQuery(query);
    
    // Annuler la recherche précédente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Si la requête est trop courte, vider les résultats
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // Indiquer qu'une recherche est en cours
    setIsSearching(true);
    
    // Débounce de 300ms pour éviter trop de requêtes
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Simulation d'une recherche API avec délai
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Données mock pour la recherche
        const mockUsers = [
          { id: 101, name: 'Alice Kouame', subtitle: t('addFriends.activeUser'), avatar: 'https://randomuser.me/api/portraits/women/10.jpg', following: false },
          { id: 102, name: 'Bob Traore', subtitle: t('addFriends.newMember'), avatar: 'https://randomuser.me/api/portraits/men/11.jpg', following: false },
          { id: 103, name: 'Claire Diallo', subtitle: t('addFriends.passionateReader'), avatar: 'https://randomuser.me/api/portraits/women/12.jpg', following: false },
          { id: 104, name: 'David Kone', subtitle: t('addFriends.activeUser'), avatar: 'https://randomuser.me/api/portraits/men/13.jpg', following: false },
          { id: 105, name: 'Emma Bamba', subtitle: t('addFriends.newMember'), avatar: 'https://randomuser.me/api/portraits/women/14.jpg', following: false },
          { id: 106, name: 'Frank Ouattara', subtitle: t('addFriends.newMember'), avatar: 'https://randomuser.me/api/portraits/men/15.jpg', following: false },
          { id: 107, name: 'Grace Yao', subtitle: t('addFriends.activeUser'), avatar: 'https://randomuser.me/api/portraits/women/16.jpg', following: false },
          { id: 108, name: 'Henri Diabate', subtitle: t('addFriends.passionateReader'), avatar: 'https://randomuser.me/api/portraits/men/17.jpg', following: false },
        ];

        // Filtrer les résultats
        const filtered = mockUsers.filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase())
        );
        
        // Vérifier que la requête n'a pas changé pendant la recherche
        if (query === searchQuery) {
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Erreur de recherche:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Nettoyer le timeout au démontage du composant
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleShareLink = async () => {
    try {
      const userProfile = user?.username || 'user123';
      const message = t('addFriends.shareMessage').replace('{userProfile}', userProfile);
      await Share.share({
        message: message,
        title: t('addFriends.shareTitle'),
      });
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert(t('common.errorText'), t('addFriends.shareError'));
    }
  };

  const handleShowAll = () => {
    setShowAllSuggestions(!showAllSuggestions);
  };

  const inviteContact = (contact: Contact) => {
    const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
    if (phoneNumber) {
      const message = t('addFriends.inviteMessage').replace('{name}', contact.name);
      Share.share({
        message: message
      });
    } else {
      Alert.alert(t('addFriends.noPhoneNumber'), t('addFriends.noPhoneNumberMessage'));
    }
  };

  const displayedSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 4);

  const ContactModal = () => (
    <Modal
      visible={showContactsModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowContactsModal(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('addFriends.myContacts')}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <Avatar.Text 
                  size={40} 
                  label={item.name.charAt(0).toUpperCase()}
                  style={{ backgroundColor: '#8A2BE2' }}
                />
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactPhone}>
                    {item.phoneNumbers?.[0]?.number || t('addFriends.noPhoneNumber')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.inviteButton}
                onPress={() => inviteContact(item)}
              >
                <Text style={styles.inviteButtonText}>{t('addFriends.invite')}</Text>
              </TouchableOpacity>
            </View>
          )}
          style={styles.contactsList}
        />
      </SafeAreaView>
    </Modal>
  );

  const SearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('addFriends.searchFriends')}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('addFriends.searchPlaceholder')}
                value={searchQuery}
                onChangeText={performSearch}
                autoFocus
                returnKeyType="search"
                blurOnSubmit={false}
                keyboardShouldPersistTaps="always"
                onSubmitEditing={() => {}}
                onBlur={() => {}}
                onFocus={() => {}}
              />
              {isSearching && (
                <View style={styles.searchLoader}>
                  <Ionicons name="refresh" size={20} color="#8A2BE2" />
                </View>
              )}
            </View>
          </View>
          
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            scrollEnabled={true}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultItem}
                activeOpacity={0.7}
                onPress={() => {}}
              >
                <View style={styles.suggestionLeft}>
                  <Avatar.Image
                    source={{ uri: item.avatar }}
                    size={50}
                  />
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName}>{item.name}</Text>
                    <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.followButton}
                  onPress={() => handleFollow(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add" size={16} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => {
              if (isSearching) {
                return (
                  <View style={styles.searchingContainer}>
                    <Ionicons name="search" size={40} color="#ccc" />
                    <Text style={styles.searchingText}>{t('addFriends.searching')}</Text>
                  </View>
                );
              }
              
              if (searchQuery.length >= 2) {
                return (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="person-outline" size={40} color="#ccc" />
                    <Text style={styles.noResults}>{t('addFriends.noResults')}</Text>
                    <Text style={styles.noResultsSubtext}>
                      {t('addFriends.noResultsSubtext')}
                    </Text>
                  </View>
                );
              }
              
              return (
                <View style={styles.searchHintContainer}>
                  <Ionicons name="search-outline" size={40} color="#ccc" />
                  <Text style={styles.searchHint}>
                    {t('addFriends.searchHint')}
                  </Text>
                </View>
              );
            }}
            style={styles.searchResultsList}
            contentContainerStyle={styles.searchResultsContent}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('addFriends.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Options de recherche */}
        <View style={styles.searchOptions}>
          <TouchableOpacity style={styles.searchOption} onPress={handleSearchContacts}>
            <View style={[styles.searchOptionIcon, { backgroundColor: '#8A2BE2' }]}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <Text style={styles.searchOptionText}>{t('addFriends.inviteFromContacts')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchOption} onPress={handleSearchByName}>
            <View style={[styles.searchOptionIcon, { backgroundColor: '#8A2BE2' }]}>
              <Ionicons name="search" size={24} color="#fff" />
            </View>
            <Text style={styles.searchOptionText}>{t('addFriends.searchByName')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchOption} onPress={handleShareLink}>
            <View style={[styles.searchOptionIcon, { backgroundColor: '#8A2BE2' }]}>
              <Ionicons name="share" size={24} color="#fff" />
            </View>
            <Text style={styles.searchOptionText}>{t('addFriends.shareProfileLink')}</Text>
          </TouchableOpacity>
        </View>

        {/* Section suggestions */}
        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsTitle}>{t('addFriends.suggestions')}</Text>
            <TouchableOpacity onPress={handleShowAll}>
              <Text style={styles.showAll}>
                {showAllSuggestions ? t('addFriends.reduce') : t('addFriends.viewAllSuggestions')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Liste des suggestions */}
          <View style={styles.suggestionsList}>
            {displayedSuggestions.map((person) => (
              <View key={person.id} style={styles.suggestionItem}>
                <View style={styles.suggestionLeft}>
                  <Avatar.Image
                    source={{ uri: person.avatar }}
                    size={50}
                    style={styles.suggestionAvatar}
                  />
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName}>{person.name}</Text>
                    <Text style={styles.suggestionSubtitle}>{person.subtitle}</Text>
                  </View>
                </View>

                <View style={styles.suggestionActions}>
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      person.following && styles.followingButton
                    ]}
                    onPress={() => handleFollow(person.id)}
                  >
                    <Ionicons 
                      name={person.following ? "checkmark" : "person-add"} 
                      size={16} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => handleDismiss(person.id)}
                  >
                    <Ionicons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <ContactModal />
      <SearchModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  searchOptions: {
    marginTop: 20,
    gap: 15,
  },
  searchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  searchOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  suggestionsSection: {
    marginTop: 30,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  showAll: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionsList: {
    gap: 15,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionAvatar: {
    marginRight: 15,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  followButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    padding: 8,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#4CAF50',
  },
  dismissButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 8,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactDetails: {
    marginLeft: 15,
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inviteButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 50,
  },
  searchLoader: {
    position: 'absolute',
    right: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResultsContent: {
    paddingBottom: 100, // Espace pour le clavier
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  searchingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  noResultsSubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
  searchHintContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  searchHint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 10,
  },
});

export default AddFriendsScreen;













