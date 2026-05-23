/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * High performance non-blocking UDP Transport engine.
 * Employs responsive GCC-like congestion control and active RTT estimations.
 */

#include <stdio.h>
#include <string.h>
#define WIN32_LEAN_AND_MEAN
#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

class AdaptiveUdpTransportEngine {
private:
    SOCKET m_Socket = INVALID_SOCKET;
    sockaddr_in m_ClientAddr = {};
    ULONG m_BandwidthEstBps = 15000000; // Start at 15 Mbps baseline
    double m_MovingAverageRttMs = 5.0;
    double m_MovingAverageLossFraction = 0.0;

public:
    AdaptiveUdpTransportEngine() {}

    HRESULT BindServerPort(unsigned short port) {
        WSADATA wsa;
        if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) return E_FAIL;

        m_Socket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
        if (m_Socket == INVALID_SOCKET) return E_FAIL;

        // Set non-blocking mode for ultra low delay IO routines
        u_long nonBlock = 1;
        ioctlsocket(m_Socket, FIONBIO, &nonBlock);

        sockaddr_in serverAddr = {};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(m_Socket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            closesocket(m_Socket);
            return E_FAIL;
        }

        printf("[Transport] UDP Engine bound gracefully on port: %u\n", port);
        return S_OK;
    }

    // Dynamic Congestion Control Algorithm.
    // Adjusts target encoder bitrate based on client packet metrics
    ULONG AdjustCongestionLimits(double reportedRttMs, double reportedLossFraction) {
        // Rolling dampeners
        m_MovingAverageRttMs = (m_MovingAverageRttMs * 0.85) + (reportedRttMs * 0.15);
        m_MovingAverageLossFraction = (m_MovingAverageLossFraction * 0.9) + (reportedLossFraction * 0.1);

        // Network adaptation rules
        if (m_MovingAverageLossFraction > 0.02 || m_MovingAverageRttMs > 45.0) {
            // Buffer bloat or packet collision detected. Drop bitrate aggressively to clear queues.
            m_BandwidthEstBps = (ULONG)(m_BandwidthEstBps * 0.78);
        }
        else if (m_MovingAverageLossFraction < 0.005 && m_MovingAverageRttMs < 20.0) {
            // Link is clear. Safely probe higher band increments
            m_BandwidthEstBps = (ULONG)(m_BandwidthEstBps * 1.06);
        }

        // Clamp boundaries (Minimum 1.5 Mbps for safety, Maximum 40 Mbps for 4K 144Hz peaks)
        if (m_BandwidthEstBps < 1500000) m_BandwidthEstBps = 1500000;
        if (m_BandwidthEstBps > 40000000) m_BandwidthEstBps = 40000000;

        return m_BandwidthEstBps;
    }

    // Puts packet onto the socket wire
    HRESULT SendPacketBuffer(const BYTE* payload, ULONG payloadLength, const char* clientIp, unsigned short clientPort) {
        if (m_Socket == INVALID_SOCKET) return E_UNEXPECTED;

        m_ClientAddr.sin_family = AF_INET;
        m_ClientAddr.sin_port = htons(clientPort);
        inet_pton(AF_INET, clientIp, &m_ClientAddr.sin_addr);

        int bytesSent = sendto(
            m_Socket, (const char*)payload, payloadLength, 0,
            (struct sockaddr*)&m_ClientAddr, sizeof(m_ClientAddr)
        );

        if (bytesSent == SOCKET_ERROR) {
            int err = WSAGetLastError();
            if (err == WSAEWOULDBLOCK) return S_FALSE; // Queue full, discard or pace frame
            return E_FAIL;
        }

        return S_OK;
    }

    ~AdaptiveUdpTransportEngine() {
        if (m_Socket != INVALID_SOCKET) closesocket(m_Socket);
        WSACleanup();
    }
};
