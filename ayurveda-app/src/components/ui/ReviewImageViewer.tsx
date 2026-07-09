import { useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Image, Modal, Text, TouchableOpacity, View } from 'react-native'
import { Fonts } from '../../constants/theme'

const { width: W } = Dimensions.get('window')

export function ReviewImageViewer({ images, startIndex, onClose }: {
  images: string[]; startIndex: number; onClose: () => void
}) {
  const [current, setCurrent] = useState(startIndex)
  const flatRef = useRef<FlatList>(null)

  useEffect(() => {
    if (startIndex > 0) {
      const t = setTimeout(() => flatRef.current?.scrollToIndex({ index: startIndex, animated: false }), 60)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Header */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 18 }}>
          {images.length > 1
            ? <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: Fonts.medium }}>{current + 1} / {images.length}</Text>
            : <View />
          }
          <TouchableOpacity onPress={onClose} style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 22 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Swipeable images */}
        <FlatList
          ref={flatRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
          onMomentumScrollEnd={e => setCurrent(Math.round(e.nativeEvent.contentOffset.x / W))}
          renderItem={({ item }) => (
            <View style={{ width: W, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={{ uri: item }} style={{ width: W, height: W * 1.2 }} resizeMode="contain" />
            </View>
          )}
          keyExtractor={(_, i) => String(i)}
          style={{ flex: 1 }}
        />

        {/* Dot indicators */}
        {images.length > 1 && (
          <View style={{ position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {images.map((_, i) => (
              <View key={i} style={{ width: i === current ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,0.35)' }} />
            ))}
          </View>
        )}

        <View style={{ position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>← swipe →</Text>
        </View>
      </View>
    </Modal>
  )
}
