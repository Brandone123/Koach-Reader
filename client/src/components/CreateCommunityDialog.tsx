import React, { useState } from 'react';
import {
  Dialog,
  Portal,
  Button,
  TextInput,
  Text,
  Switch,
  Surface,
  useTheme,
  Chip
} from 'react-native-paper';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../store/hooks';
import { createCommunity } from '../slices/communitiesSlice';
import { selectUser } from '../slices/authSlice';
import { useTranslation } from 'react-i18next';

interface CreateCommunityDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

const COMMUNITY_CATEGORIES = [
  'Spiritual Growth',
  'Christian Impact',
  'Church Community',
  'Christian Literature',
  'Bible Study',
  'Youth Ministry',
  'Worship',
  'Prayer',
];

const CreateCommunityDialog: React.FC<CreateCommunityDialogProps> = ({
  visible,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useSelector(selectUser);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user?.id) return;
    
    setLoading(true);
    try {
      await dispatch(createCommunity({
        name: name.trim(),
        description: description.trim(),
        creator_id: user.id,
        category: category || undefined,
        is_private: isPrivate,
      })).unwrap();
      
      setName('');
      setDescription('');
      setCategory('');
      setIsPrivate(false);
      onDismiss();
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={[styles.title, { color: theme.colors.primary }]}>
          {t('communities.createCommunity')}
        </Dialog.Title>
        
        <Dialog.Content>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              label={t('communities.communityName')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              maxLength={100}
            />
            
            <TextInput
              label={t('communities.description')}
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              maxLength={500}
            />
            
            <Text style={styles.categoryLabel}>{t('communities.category')}</Text>
            <View style={styles.categoriesContainer}>
              {COMMUNITY_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  selected={category === cat}
                  onPress={() => setCategory(category === cat ? '' : cat)}
                  style={styles.categoryChip}
                  mode={category === cat ? 'flat' : 'outlined'}
                >
                  {cat}
                </Chip>
              ))}
            </View>
            
            <Surface style={styles.switchContainer} elevation={1}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>{t('communities.privateCommunity')}</Text>
                  <Text style={styles.switchDescription}>
                    {t('communities.privateCommunityDescription')}
                  </Text>
                </View>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  color={theme.colors.primary}
                />
              </View>
            </Surface>
          </ScrollView>
        </Dialog.Content>
        
        <Dialog.Actions style={styles.actions}>
          <Button onPress={onDismiss} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            onPress={handleCreate}
            disabled={!name.trim() || loading}
            loading={loading}
            style={styles.createButton}
          >
            {t('common.create')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    margin: 4,
  },
  switchContainer: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  createButton: {
    marginLeft: 8,
  },
});

export default CreateCommunityDialog;