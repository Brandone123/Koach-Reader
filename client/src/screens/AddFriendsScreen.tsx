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
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { supabase } from '../lib/supabase';

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: { number: string }[];
}

type FriendRelation =
  | 'none'
  | 'friends'
  | 'outgoing_pending'
  | 'incoming_pending'
  | 'outgoing_declined';

interface Friend {
  userId: string;
  name: string;
  subtitle: string;
  avatar: string;
}

function relationFromRows(
  rows: { user_id: string; friend_id: string; status: string }[] | null,
  myId: string,
  otherUserId: string
): FriendRelation {
  if (!rows?.length) return 'none';
  for (const r of rows) {
    if (r.user_id === myId && r.friend_id === otherUserId) {
      if (r.status === 'accepted') return 'friends';
      if (r.status === 'pending') return 'outgoing_pending';
      if (r.status === 'declined') return 'outgoing_declined';
    }
    if (r.friend_id === myId && r.user_id === otherUserId) {
      if (r.status === 'accepted') return 'friends';
      if (r.status === 'pending') return 'incoming_pending';
    }
  }
  return 'none';
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
  const latestSearchQueryRef = useRef('');

  const [suggestions, setSuggestions] = useState<Friend[]>([]);
  const [friendshipRows, setFriendshipRows] = useState<
    { user_id: string; friend_id: string; status: string }[]
  >([]);

  useEffect(() => {
    if (!user?.id) {
      setFriendshipRows([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('friends')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      if (error) {
        console.error('friends load', error);
        return;
      }
      setFriendshipRows(data || []);
    })();
  }, [user?.id]);

  const relationTo = (otherUserId: string) =>
    relationFromRows(friendshipRows, String(user?.id || ''), otherUserId);

  const refreshFriendships = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('friends')
      .select('user_id, friend_id, status')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    setFriendshipRows(data || []);
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user?.id || targetUserId === user.id) return;
    const rel = relationTo(targetUserId);
    if (rel === 'friends' || rel === 'outgoing_pending' || rel === 'incoming_pending') {
      if (rel === 'incoming_pending') {
        Alert.alert(t('addFriends.sendRequest'), t('addFriends.respondInProfile'));
      }
      return;
    }
    const { error } = await supabase.from('friends').insert({
      user_id: user.id,
      friend_id: targetUserId,
      status: 'pending',
    });
    if (error) {
      if ((error as { code?: string }).code === '23505') {
        Alert.alert(t('common.errorText'), t('addFriends.alreadyPending'));
      } else {
        Alert.alert(t('common.errorText'), t('addFriends.friendRequestError'));
      }
      return;
    }
    await refreshFriendships();
    Alert.alert(t('common.success'), t('addFriends.requestSent'));
  };

  const handleDismiss = (userId: string) => {
    setSuggestions((prev) => prev.filter((person) => person.userId !== userId));
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
          
          setContacts(formattedContacts as Contact[]);
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
    setSearchQuery(query);
    latestSearchQueryRef.current = query;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const queryAtSchedule = query;

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .ilike('username', `%${queryAtSchedule}%`)
          .limit(20);
        if (error) throw error;

        if (latestSearchQueryRef.current !== queryAtSchedule) {
          return;
        }

        const filtered: Friend[] = (data || [])
          .filter((u: { id: string }) => String(u.id) !== String(user?.id))
          .map((u: { id: string; username?: string; avatar_url?: string | null }) => {
            const name = u.username || t('addFriends.contactNoName');
            return {
              userId: String(u.id),
              name,
              subtitle: t('addFriends.activeUser'),
              avatar:
                u.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
            };
          });

        setSearchResults(filtered);
      } catch (error) {
        console.error('Erreur de recherche:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .limit(12);
        if (error) throw error;
        const mapped: Friend[] = (data || [])
          .filter((u: { id: string }) => String(u.id) !== String(user?.id))
          .map((u: { id: string; username?: string; avatar_url?: string | null }) => {
            const name = u.username || t('addFriends.contactNoName');
            return {
              userId: String(u.id),
              name,
              subtitle: t('addFriends.activeUser'),
              avatar:
                u.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
            };
          });
        setSuggestions(mapped);
      } catch (error) {
        console.error('Erreur chargement suggestions:', error);
      }
    };
    loadSuggestions();
  }, [user?.id, t]);

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
            keyExtractor={(item) => item.userId}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            scrollEnabled={true}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
            renderItem={({ item }) => {
              const rel = relationTo(item.userId);
              const disabled =
                rel === 'friends' ||
                rel === 'outgoing_pending' ||
                rel === 'incoming_pending';
              return (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  activeOpacity={0.7}
                  onPress={() => {}}
                >
                  <View style={styles.suggestionLeft}>
                    <Avatar.Image source={{ uri: item.avatar }} size={50} />
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{item.name}</Text>
                      <Text style={styles.suggestionSubtitle}>
                        {rel === 'friends'
                          ? t('addFriends.alreadyFriends')
                          : rel === 'outgoing_pending'
                            ? t('addFriends.alreadyPending')
                            : rel === 'incoming_pending'
                              ? t('addFriends.respondInProfile')
                              : item.subtitle}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      rel === 'friends' && styles.followingButton,
                      disabled && rel !== 'friends' && { opacity: 0.6 },
                    ]}
                    onPress={() => {
                      if (rel === 'incoming_pending') {
                        setShowSearchModal(false);
                        navigation.navigate('Profile');
                        return;
                      }
                      sendFriendRequest(item.userId);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={
                        rel === 'friends'
                          ? 'checkmark'
                          : rel === 'outgoing_pending'
                            ? 'time'
                            : 'person-add'
                      }
                      size={16}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
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
            {displayedSuggestions.map((person) => {
              const rel = relationTo(person.userId);
              const disabled =
                rel === 'friends' ||
                rel === 'outgoing_pending' ||
                rel === 'incoming_pending';
              return (
                <View key={person.userId} style={styles.suggestionItem}>
                  <View style={styles.suggestionLeft}>
                    <Avatar.Image
                      source={{ uri: person.avatar }}
                      size={50}
                      style={styles.suggestionAvatar}
                    />
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{person.name}</Text>
                      <Text style={styles.suggestionSubtitle}>
                        {rel === 'friends'
                          ? t('addFriends.alreadyFriends')
                          : rel === 'outgoing_pending'
                            ? t('addFriends.alreadyPending')
                            : rel === 'incoming_pending'
                              ? t('addFriends.respondInProfile')
                              : person.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.suggestionActions}>
                    <TouchableOpacity
                      style={[
                        styles.followButton,
                        rel === 'friends' && styles.followingButton,
                        disabled && rel !== 'friends' && { opacity: 0.6 },
                      ]}
                      onPress={() => {
                        if (rel === 'incoming_pending') {
                          navigation.navigate('Profile');
                          return;
                        }
                        sendFriendRequest(person.userId);
                      }}
                    >
                      <Ionicons
                        name={
                          rel === 'friends'
                            ? 'checkmark'
                            : rel === 'outgoing_pending'
                              ? 'time'
                              : 'person-add'
                        }
                        size={16}
                        color="#fff"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dismissButton}
                      onPress={() => handleDismiss(person.userId)}
                    >
                      <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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













