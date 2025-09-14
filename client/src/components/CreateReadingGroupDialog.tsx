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
  ActivityIndicator
} from 'react-native-paper';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createReadingGroup } from '../slices/readingGroupsSlice';
import { selectUser } from '../slices/authSlice';
import { AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';

interface CreateReadingGroupDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

const CreateReadingGroupDialog: React.FC<CreateReadingGroupDialogProps> = ({
  visible,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user?.id) return;
    
    setLoading(true);
    try {
      await dispatch(createReadingGroup({
        name: name.trim(),
        description: description.trim(),
        creator_id: user.id,
        is_private: isPrivate,
      })).unwrap();
      
      setName('');
      setDescription('');
      setIsPrivate(false);
      onDismiss();
    } catch (error) {
      console.error('Error creating reading group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={[styles.title, { color: theme.colors.primary }]}>
          {t('readingGroups.createGroup')}
        </Dialog.Title>
        
        <Dialog.Content>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              label={t('readingGroups.groupName')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              maxLength={100}
            />
            
            <TextInput
              label={t('readingGroups.description')}
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              maxLength={500}
            />
            
            <Surface style={styles.switchContainer} elevation={1}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>{t('readingGroups.privateGroup')}</Text>
                  <Text style={styles.switchDescription}>
                    {t('readingGroups.privateGroupDescription')}
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
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
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

export default CreateReadingGroupDialog;