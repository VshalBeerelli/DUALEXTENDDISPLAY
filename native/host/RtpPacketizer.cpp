/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Frame packetizer and Selective Retransmission (ARQ) tracker.
 * Implements MTU boundary fragmentation, RTP-like sequence tagging, and Forward Error Correction (FEC).
 */

#include <stdio.h>
#include <string.h>
#include <vector>
#include <map>

#define PACKET_MTU_LIMIT 1400  // Safe UDP frame boundary to prevent IP fragmentation
#define MAX_RETRANSMIT_BUFFER 500

struct StreamPacketHeader {
    unsigned short SequenceNumber;
    unsigned int Timestamp;
    unsigned char FrameType;      // 0 = Key Frame (IDR), 1 = Delta (P-Frame), 2 = Audio
    unsigned char PacketIndex;
    unsigned char TotalPacketsInFrame;
};

struct PacketPayload {
    StreamPacketHeader Header;
    unsigned char Data[PACKET_MTU_LIMIT];
    unsigned int Length;
};

class RtpStreamPacketizer {
private:
    unsigned short m_NextSequence = 0;
    std::map<unsigned short, PacketPayload> m_RetransmissionCache; // ARQ sliding window buffer

public:
    RtpStreamPacketizer() {}

    // Breaks down large H.264 slice frames into standard MTU blocks and generates XOR FEC packets
    std::vector<PacketPayload> PacketizeFrame(const unsigned char* h264AnnexBData, unsigned int frameLength, unsigned int timestamp, unsigned char frameType) {
        std::vector<PacketPayload> generatedPackets;
        unsigned int offset = 0;
        unsigned char packetIndex = 0;
        
        // Calculate total subdivisions
        unsigned char totalPackets = (frameLength + PACKET_MTU_LIMIT - 1) / PACKET_MTU_LIMIT;
        if (totalPackets == 0) totalPackets = 1;

        while (offset < frameLength) {
            PacketPayload pkt = {};
            pkt.Header.SequenceNumber = m_NextSequence++;
            pkt.Header.Timestamp = timestamp;
            pkt.Header.FrameType = frameType;
            pkt.Header.PacketIndex = packetIndex++;
            pkt.Header.TotalPacketsInFrame = totalPackets;

            unsigned int chunkBytes = (frameLength - offset > PACKET_MTU_LIMIT) ? PACKET_MTU_LIMIT : (frameLength - offset);
            memcpy(pkt.Data, h264AnnexBData + offset, chunkBytes);
            pkt.Length = chunkBytes;

            // Enqueue into ARQ sliding window cache for responsive UDP recovery
            m_RetransmissionCache[pkt.Header.SequenceNumber] = pkt;
            if (m_RetransmissionCache.size() > MAX_RETRANSMIT_BUFFER) {
                m_RetransmissionCache.erase(m_RetransmissionCache.begin()); // Erase oldest
            }

            generatedPackets.push_back(pkt);
            offset += chunkBytes;
        }

        // Generate XOR FEC (Forward Error Correction) packet if frame is a vital IDR Keyframe
        if (frameType == 0 && generatedPackets.size() > 1) {
            PacketPayload fecPkt = {};
            fecPkt.Header.SequenceNumber = m_NextSequence++;
            fecPkt.Header.Timestamp = timestamp;
            fecPkt.Header.FrameType = 0xFE; // Mark as FEC packet type
            fecPkt.Header.PacketIndex = 0xFF;
            fecPkt.Header.TotalPacketsInFrame = generatedPackets.size();

            // XOR accumulator across all chunks of the frame
            for (size_t i = 0; i < generatedPackets.size(); ++i) {
                fecPkt.Length = (generatedPackets[i].Length > fecPkt.Length) ? generatedPackets[i].Length : fecPkt.Length;
                for (unsigned int j = 0; j < fecPkt.Length; ++j) {
                    fecPkt.Data[j] ^= generatedPackets[i].Data[j];
                }
            }
            generatedPackets.push_back(fecPkt);
        }

        return generatedPackets;
    }

    // Handles selective NACK retransmission requests from client
    bool HandleRetransmitRequest(unsigned short lostSequence, PacketPayload* outPacket) {
        auto iter = m_RetransmissionCache.find(lostSequence);
        if (iter != m_RetransmissionCache.end()) {
            *outPacket = iter->second;
            printf("[ARQ] Serviced retransmission request for Packet sequence %u\n", lostSequence);
            return true;
        }
        printf("[ARQ] Retransmit failed. Packet sequence %u has slid out of cache window.\n", lostSequence);
        return false;
    }
};
