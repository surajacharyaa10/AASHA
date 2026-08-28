import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible } from '@/components/ui/collapsible';

export default function ProfileScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F8FAFC',
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
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
          {/* Top Header */}
          <View
            style={{
              marginBottom: 14,
              paddingHorizontal: 4,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: '#0F172A',
                }}
              >
                Medical ID & Survival
              </Text>

              <Badge
                label="OFFLINE CACHED"
                variant="success"
              />
            </View>

            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#64748B',
                marginTop: 2,
              }}
            >
              Accessible by paramedics & rescue teams without internet
            </Text>
          </View>

          {/* Trekker Medical Profile Card */}
          <Card
            variant="elevated"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              padding: 16,
              borderRadius: 20,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#0F172A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '900',
                    color: '#FFFFFF',
                  }}
                >
                  SA
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: '#0F172A',
                  }}
                >
                  Suraj Acharya
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color: '#64748B',
                    fontWeight: '500',
                    marginTop: 1,
                  }}
                >
                  High-Altitude Trekker · Age 26
                </Text>

                <View
                  style={{
                    backgroundColor: '#FEE2E2',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    marginTop: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: '#DC2626',
                      letterSpacing: 0.5,
                    }}
                  >
                    BLOOD GROUP: O+ POSITIVE
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: '#F1F5F9',
                gap: 10,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#94A3B8',
                    letterSpacing: 0.5,
                  }}
                >
                  ALLERGIES
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: '#1E293B',
                  }}
                >
                  Penicillin, Sulfa
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#94A3B8',
                    letterSpacing: 0.5,
                  }}
                >
                  HELI EVAC COVERAGE
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: '#1E293B',
                  }}
                >
                  Active (Policy #NEP-9921)
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#94A3B8',
                    letterSpacing: 0.5,
                  }}
                >
                  TIMS PERMIT
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: '#1E293B',
                  }}
                >
                  #NPR-881923 (Solukhumbu)
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: '#94A3B8',
                    letterSpacing: 0.5,
                  }}
                >
                  PRIMARY LANGUAGE
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: '#1E293B',
                  }}
                >
                  Nepali, English
                </Text>
              </View>
            </View>
          </Card>

          {/* Offline Survival Field Guides */}
          <View
            style={{
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: '#0F172A',
                paddingHorizontal: 4,
              }}
            >
              Offline Disaster Field Manual
            </Text>

            <Text
              style={{
                fontSize: 11,
                color: '#64748B',
                fontWeight: '500',
                marginTop: 2,
                marginBottom: 10,
                paddingHorizontal: 4,
              }}
            >
              Critical protocols for mountain, earthquake & wilderness survival
            </Text>

            <View
              style={{
                gap: 10,
              }}
            >
              {/* AMS */}
              <Collapsible title="🏔️ Acute Mountain Sickness (AMS / HAPE)">
                <View
                  style={{
                    gap: 8,
                    paddingTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    1.{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      Immediate Descent:
                    </Text>{' '}
                    Descend at least 500m to 1,000m immediately. Do not ascend with symptoms.
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    2.{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      Oxygen & Warmth:
                    </Text>{' '}
                    Administer portable supplemental oxygen (2–4 L/min) or hyperbaric chamber bag.
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    3.{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      Medication:
                    </Text>{' '}
                    Acetazolamide (Diamox) 250mg or Dexamethasone if advised by medical lead.
                  </Text>
                </View>
              </Collapsible>

              {/* Helicopter Signaling */}
              <Collapsible title="🚁 Ground-to-Air Helicopter Signaling">
                <View
                  style={{
                    gap: 8,
                    paddingTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    •{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      "Y" Arms Form:
                    </Text>{' '}
                    Both arms raised in "V/Y" shape above head = "YES / WE NEED RESCUE".
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    •{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      "N" One Arm Up:
                    </Text>{' '}
                    One arm raised, other down = "NO / ALL OK".
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    •{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      Landing Zone:
                    </Text>{' '}
                    Clear a 25m x 25m flat zone of loose rocks, tarps, and gear. Stand with back to wind.
                  </Text>
                </View>
              </Collapsible>

              {/* Frostbite */}
              <Collapsible title="❄️ Frostbite & Hypothermia Protocol">
                <View
                  style={{
                    gap: 8,
                    paddingTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    •{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      Rewarming:
                    </Text>{' '}
                    Use body-to-body contact or warm water (37°C–39°C). Never rub frostbitten skin with snow.
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    •{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      Insulation:
                    </Text>{' '}
                    Remove wet layers; insulate victim from ground with sleeping pads or backpacks.
                  </Text>
                </View>
              </Collapsible>

              {/* Earthquake */}
              <Collapsible title="⚠️ Earthquake & Structural Collapse">
                <View
                  style={{
                    gap: 8,
                    paddingTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    •{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      Drop, Cover & Hold:
                    </Text>{' '}
                    Stay clear of stone walls and fragile masonry.
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      lineHeight: 18,
                    }}
                  >
                    •{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: '#0F172A',
                      }}
                    >
                      If Trapped:
                    </Text>{' '}
                    Tap rhythmically on pipes/stones (3 taps = SOS) rather than shouting to conserve oxygen and energy.
                  </Text>
                </View>
              </Collapsible>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}