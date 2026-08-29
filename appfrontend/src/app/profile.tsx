import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomTabInset,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';
import BACKEND_URL_CONFIG from '@/lib/config';


type Profile = {
  name: string;
  address: string;
  email: string;
  phone: string;
  bloodGroup: string;
};

const EMPTY_PROFILE: Profile = {
  name: '',
  address: '',
  email: '',
  phone: '',
  bloodGroup: '',
};

// ─── Backend config ──────────────────────────────────────────────────────────
const BACKEND_URL = BACKEND_URL_CONFIG;

// Device ID — same constant used in sosService.ts.
const DEVICE_ID = 'f3a9c2e1b8d04a17';



// ─── Database helpers ─────────────────────────────────────────────────────────

const getProfileFromDatabase = async (): Promise<Profile> => {
  const res = await fetch(`${BACKEND_URL}/api/profile/${DEVICE_ID}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  return (await res.json()) as Profile;
};

const updateProfileInDatabase = async (profile: Profile): Promise<Profile> => {
  const res = await fetch(`${BACKEND_URL}/api/profile/${DEVICE_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  return (await res.json()) as Profile;
};


const FIELDS: {
  key: keyof Profile;
  label: string;
  placeholder: string;
  keyboardType: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize: 'none' | 'words' | 'sentences' | 'characters';
}[] = [
  {
    key: 'name',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    keyboardType: 'default',
    autoCapitalize: 'words',
  },
  {
    key: 'address',
    label: 'Address',
    placeholder: 'Enter your current address',
    keyboardType: 'default',
    autoCapitalize: 'sentences',
  },
  {
    key: 'email',
    label: 'Gmail',
    placeholder: 'you@example.com',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
  {
    key: 'phone',
    label: 'Phone Number',
    placeholder: 'Enter your phone number',
    keyboardType: 'phone-pad',
    autoCapitalize: 'none',
  },
  {
    key: 'bloodGroup',
    label: 'Blood Group',
    placeholder: 'e.g. O+ POSITIVE',
    keyboardType: 'default',
    autoCapitalize: 'characters',
  },
];

export default function ProfileScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);

  // Keeps the last database version so Cancel can restore it.
  const [savedProfile, setSavedProfile] =
    useState<Profile>(EMPTY_PROFILE);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);

        const data = await getProfileFromDatabase();

        const databaseProfile: Profile = {
          ...EMPTY_PROFILE,
          ...data,
        };

        setProfile(databaseProfile);
        setSavedProfile(databaseProfile);
      } catch (error) {
        console.error('Failed to load profile:', error);

        Alert.alert(
          'Unable to load profile',
          'We could not retrieve your emergency profile. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);


  const updateField = (key: keyof Profile, value: string) => {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  };


  const startEditing = () => {
    // Make sure editing always starts from the latest saved data.
    setProfile(savedProfile);
    setIsEditing(true);
  };


  const cancelEditing = () => {
    setProfile(savedProfile);
    setIsEditing(false);
  };


  const saveProfile = async () => {
    try {
      setIsSaving(true);

      const updatedProfile =
        await updateProfileInDatabase(profile);

      const databaseProfile: Profile = {
        ...EMPTY_PROFILE,
        ...updatedProfile,
      };

      setProfile(databaseProfile);
      setSavedProfile(databaseProfile);

      setIsEditing(false);

      Alert.alert(
        'Profile saved',
        'Your emergency profile has been updated successfully.',
      );
    } catch (error) {
      console.error('Failed to save profile:', error);

      Alert.alert(
        'Unable to save',
        'Your profile could not be updated. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };


  const filledFields = useMemo(
    () =>
      Object.values(profile).filter(
        (value) => value.trim().length > 0,
      ).length,
    [profile],
  );

  const completion = Math.round((filledFields / 5) * 100);

  const initials = useMemo(() => {
    const value = profile.name.trim();

    if (!value) {
      return 'ME';
    }

    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [profile.name]);

  const displayRows: {
    label: string;
    value: string;
    icon: string;
  }[] = [
    {
      label: 'Full Name',
      value: profile.name,
      icon: '👤',
    },
    {
      label: 'Address',
      value: profile.address,
      icon: '📍',
    },
    {
      label: 'Gmail',
      value: profile.email,
      icon: '✉️',
    },
    {
      label: 'Phone Number',
      value: profile.phone,
      icon: '📞',
    },
  ];


  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#F3F6FA',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 70,
            height: 70,
            borderRadius: 22,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          <ActivityIndicator
            size="large"
            color="#0F172A"
          />
        </View>

        <Text
          style={{
            marginTop: 16,
            color: '#0F172A',
            fontSize: 15,
            fontWeight: '800',
          }}
        >
          Loading emergency profile...
        </Text>

        <Text
          style={{
            marginTop: 5,
            color: '#64748B',
            fontSize: 12,
            fontWeight: '600',
          }}
        >
          Retrieving your saved information
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F3F6FA',
      }}
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom:
              safeAreaInsets.bottom +
              BottomTabInset +
              Spacing.six,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: MaxContentWidth,
            }}
          >

            <View
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 30,
                padding: 22,
                minHeight: 184,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  width: 180,
                  height: 180,
                  borderRadius: 90,
                  right: -55,
                  top: -70,
                  backgroundColor: '#1E3A5F',
                  opacity: 0.8,
                }}
              />

              <View
                style={{
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  right: 48,
                  bottom: -75,
                  backgroundColor: '#164E63',
                  opacity: 0.45,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View
                  style={{
                    flex: 1,
                    paddingRight: 14,
                  }}
                >
                  <Text
                    style={{
                      color: '#BAE6FD',
                      fontSize: 11,
                      fontWeight: '900',
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                    }}
                  >
                    Emergency profile
                  </Text>

                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 28,
                      lineHeight: 34,
                      fontWeight: '900',
                      marginTop: 5,
                    }}
                  >
                    Emergency Profile
                  </Text>

                  <Text
                    style={{
                      color: '#CBD5E1',
                      fontSize: 13,
                      lineHeight: 19,
                      fontWeight: '600',
                      marginTop: 7,
                    }}
                  >
                    Your essential information, ready when it matters
                    most.
                  </Text>
                </View>

                <View
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 22,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#0F172A',
                      fontSize: 20,
                      fontWeight: '900',
                    }}
                  >
                    {initials}
                  </Text>
                </View>
              </View>

              {/* Database status */}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 20,
                  alignSelf: 'flex-start',
                  paddingHorizontal: 11,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor:
                    'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor:
                    'rgba(255,255,255,0.16)',
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: '#4ADE80',
                    marginRight: 7,
                  }}
                />

                <Text
                  style={{
                    color: '#E2E8F0',
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                >
                 आशा
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                marginBottom: 16,
              }}
            >
            </View>

            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: 18,
                marginBottom: 16,
                shadowColor: '#0F172A',
                shadowOpacity: 0.06,
                shadowRadius: 18,
                shadowOffset: {
                  width: 0,
                  height: 7,
                },
                elevation: 3,
              }}
            >
              {/* Header */}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 17,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 17,
                      backgroundColor: '#E0F2FE',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                      }}
                    >
                      👤
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#64748B',
                        fontWeight: '900',
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                      }}
                    >
                      Personal details
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 18,
                        color: '#0F172A',
                        fontWeight: '900',
                        marginTop: 3,
                      }}
                    >
                      {profile.name || 'Your profile'}
                    </Text>
                  </View>
                </View>

                {!isEditing && (
                  <Pressable
                    onPress={startEditing}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: pressed
                        ? '#E2E8F0'
                        : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '900',
                        color: '#0F172A',
                      }}
                    >
                      Edit
                    </Text>
                  </Pressable>
                )}
              </View>

              {isEditing ? (
                <View
                  style={{
                    gap: 13,
                  }}
                >
                  {FIELDS.map((field) => (
                    <View key={field.key}>
                      <Text
                        style={{
                          color: '#334155',
                          fontSize: 11,
                          fontWeight: '900',
                          marginBottom: 7,
                        }}
                      >
                        {field.label.toUpperCase()}
                      </Text>

                      <TextInput
                        value={profile[field.key]}
                        onChangeText={(value) =>
                          updateField(
                            field.key,
                            value,
                          )
                        }
                        placeholder={
                          field.placeholder
                        }
                        placeholderTextColor="#94A3B8"
                        keyboardType={
                          field.keyboardType
                        }
                        autoCapitalize={
                          field.autoCapitalize
                        }
                        editable={!isSaving}
                        style={{
                          minHeight: 50,
                          backgroundColor: '#F8FAFC',
                          borderRadius: 15,
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          color: '#0F172A',
                          fontSize: 14,
                          fontWeight: '600',
                        }}
                      />
                    </View>
                  ))}

                  {/* Buttons */}

                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      marginTop: 4,
                    }}
                  >
                    <Pressable
                      disabled={isSaving}
                      onPress={cancelEditing}
                      style={{
                        flex: 1,
                        minHeight: 50,
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#F1F5F9',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    >
                      <Text
                        style={{
                          color: '#334155',
                          fontSize: 14,
                          fontWeight: '900',
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>

                    <Pressable
                      disabled={isSaving}
                      onPress={saveProfile}
                      style={{
                        flex: 1,
                        minHeight: 50,
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSaving
                          ? '#64748B'
                          : '#0F172A',
                      }}
                    >
                      {isSaving ? (
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />
                      ) : (
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontSize: 14,
                            fontWeight: '900',
                          }}
                        >
                          Save Changes
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    gap: 9,
                  }}
                >
                  {displayRows.map((item) => (
                    <View
                      key={item.label}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 16,
                        backgroundColor: '#F8FAFC',
                        borderWidth: 1,
                        borderColor: '#EEF2F6',
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: '#FFFFFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 11,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                          }}
                        >
                          {item.icon}
                        </Text>
                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '900',
                            color: '#94A3B8',
                            letterSpacing: 0.6,
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.label}
                        </Text>

                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: item.value
                              ? '#1E293B'
                              : '#94A3B8',
                            marginTop: 3,
                          }}
                        >
                          {item.value ||
                            'Not provided'}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Blood Group */}

                  <View
                    style={{
                      marginTop: 2,
                      padding: 15,
                      borderRadius: 17,
                      backgroundColor: '#FFF7ED',
                      borderWidth: 1,
                      borderColor: '#FED7AA',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 11,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                        }}
                      >
                        🩸
                      </Text>
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '900',
                          color: '#C2410C',
                        }}
                      >
                        BLOOD GROUP
                      </Text>

                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: '900',
                          color: profile.bloodGroup
                            ? '#9A3412'
                            : '#C2410C',
                          marginTop: 2,
                        }}
                      >
                        {profile.bloodGroup ||
                          'Not provided'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 4,
                paddingBottom: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  marginRight: 8,
                }}
              >
                🔒
              </Text>

              <Text
                style={{
                  flex: 1,
                  fontSize: 11,
                  lineHeight: 16,
                  color: '#64748B',
                  fontWeight: '600',
                }}
              >
                Your emergency profile is securely saved
                to your account and synchronized with the
                database.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}