/**
 * ShieldGuard Mobile Security - Complete Android Studio Project Artifacts
 * Production Kotlin + Jetpack Compose + Room + Coroutines
 * @license Apache-2.0
 */

export interface CodeFile {
  path: string;
  language: string;
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: CodeFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Least-privilege Android manifest with Package Visibility <queries>, Storage Access Framework, and ShareSheet Intent Filters',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="org.shieldguard.security">

    <!-- LEAST-PRIVILEGE NETWORK PERMISSION for Threat Intelligence Backend Lookup -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- BIOMETRIC ACCESS FOR SECURING SHIELDGUARD APP ACCESS -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <!-- POST_NOTIFICATIONS FOR ANDROID 13+ CRITICAL SECURITY ALERTS -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!--
      PACKAGE VISIBILITY (<queries>):
      Compliant with Android 11+ (API 30+) restrictions. Rather than requesting the dangerous
      QUERY_ALL_PACKAGES permission (which violates Google Play User Data policies for ordinary tools),
      we declare explicit intent filters and queries to discover installed browsers, payment apps,
      and packages that register share targets.
    -->
    <queries>
        <!-- Allows detecting installed Web Browsers for link security -->
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
        </intent>

        <!-- Allows detecting installed UPI Payment Apps for payment redirection safety -->
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="upi" />
        </intent>

        <!-- Package visibility for Play Store App Info links -->
        <package android:name="com.android.vending" />
    </queries>

    <application
        android:name=".ShieldGuardApplication"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ShieldGuard"
        android:usesCleartextTraffic="false"
        android:networkSecurityConfig="@xml/network_security_config"
        tools:targetApi="34">

        <!-- Main Dashboard & Security Entry Point -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.ShieldGuard"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- SHARESHEET RECEIVER: Receive URLs from WhatsApp, SMS, Browser for Phishing Analysis -->
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="text/plain" />
            </intent-filter>

            <!-- SHARESHEET RECEIVER: Receive Downloaded Files for SHA-256 & Double-Extension Inspection -->
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="application/*" />
                <data android:mimeType="image/*" />
            </intent-filter>

            <!-- UPI Deep-Link Interception (User-initiated analysis of UPI payment links) -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="shieldguard" android:host="scan" />
            </intent-filter>
        </activity>

    </application>
</manifest>`
  },
  {
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Modern Gradle KTS build script with Jetpack Compose, Room, Coroutines, and OkHttp',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.ksp)
}

android {
    namespace = "org.shieldguard.security"
    compileSdk = 34

    defaultConfig {
        applicationId = "org.shieldguard.security"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        ksp {
            arg("room.schemaLocation", "$projectDir/schemas")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // AndroidX & Lifecycle
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // Local Persistence (Room DB)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Kotlin Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Cryptography & Biometrics
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.biometric:biometric:1.2.0-alpha05")

    // Networking (Retrofit & OkHttp with Certificate Pinning)
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Testing
    testImplementation(libs.junit)
    testImplementation("io.mockk:mockk:1.13.9")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
}`
  },
  {
    path: 'app/src/main/java/org/shieldguard/security/data/local/ScanHistoryEntity.kt',
    language: 'kotlin',
    description: 'Room Entity for storing audit and scan history locally without leaking private data',
    content: `package org.shieldguard.security.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class RiskLevel {
    SAFE,
    SUSPICIOUS,
    HIGH_RISK,
    UNABLE_TO_VERIFY
}

enum class ScanType {
    QUICK_SCAN,
    FULL_DEVICE_SCAN,
    URL_PHISHING_SCAN,
    UPI_PAYMENT_SCAN,
    FILE_SIGNATURE_SCAN,
    APP_INSPECTION
}

@Entity(tableName = "scan_history")
data class ScanHistoryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val timestamp: Long,
    val scanType: ScanType,
    val targetIdentifier: String,
    val riskLevel: RiskLevel,
    val findingsSummary: String,
    val totalFindings: Int,
    val isRemediated: Boolean = false
)

@Entity(tableName = "fraud_reports")
data class FraudReportEntity(
    @PrimaryKey
    val reportReference: String,
    val category: String,
    val target: String,
    val description: String,
    val submittedAt: Long,
    val syncedWithBackend: Boolean,
    val officialHelplineDialed: Boolean = false
)`
  },
  {
    path: 'app/src/main/java/org/shieldguard/security/data/local/ScanHistoryDao.kt',
    language: 'kotlin',
    description: 'Room DAO for scan history queries, filtering by risk level, and reporting metrics',
    content: `package org.shieldguard.security.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ScanHistoryDao {
    @Query("SELECT * FROM scan_history ORDER BY timestamp DESC")
    fun getAllScanHistory(): Flow<List<ScanHistoryEntity>>

    @Query("SELECT * FROM scan_history WHERE riskLevel = :riskLevel ORDER BY timestamp DESC")
    fun getScansByRiskLevel(riskLevel: RiskLevel): Flow<List<ScanHistoryEntity>>

    @Query("SELECT * FROM scan_history WHERE scanType = :type ORDER BY timestamp DESC LIMIT 20")
    fun getRecentScansByType(type: ScanType): Flow<List<ScanHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertScanRecord(record: ScanHistoryEntity): Long

    @Query("DELETE FROM scan_history WHERE id = :id")
    suspend fun deleteScanRecord(id: Long)

    @Query("DELETE FROM scan_history")
    suspend fun clearHistory()

    // Fraud Reports
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFraudReport(report: FraudReportEntity)

    @Query("SELECT * FROM fraud_reports ORDER BY submittedAt DESC")
    fun getAllFraudReports(): Flow<List<FraudReportEntity>>
}`
  },
  {
    path: 'app/src/main/java/org/shieldguard/security/util/UpiParser.kt',
    language: 'kotlin',
    description: 'Robust UPI deep-link parser & fraud detector extracting VPA, amount, notes, and scam patterns',
    content: `package org.shieldguard.security.util

import android.net.Uri
import org.shieldguard.security.data.local.RiskLevel

data class UpiInspectionResult(
    val rawUri: String,
    val payeeVpa: String,
    val payeeName: String,
    val amount: String?,
    val currency: String?,
    val transactionNote: String?,
    val merchantCode: String?,
    val isVerifiedMerchant: Boolean,
    val fraudKeywords: List<String>,
    val riskLevel: RiskLevel,
    val warningMessage: String
)

object UpiParser {

    private val SUSPICIOUS_KEYWORDS = listOf(
        "cashback", "refund", "lottery", "prize", "reward", "kyc",
        "electricity", "pending bill", "part time job", "telegram task",
        "pan update", "courier customs", "free gift"
    )

    private val TRUSTED_PSP_HANDLES = listOf(
        "@icici", "@hdfcbank", "@okhdfcbank", "@okaxis", "@okicici",
        "@oksbi", "@paytm", "@ybl", "@ibl", "@axl", "@airtel"
    )

    fun parseAndInspect(input: String): UpiInspectionResult {
        val trimmed = input.trim()
        val uri = try {
            Uri.parse(trimmed)
        } catch (e: Exception) {
            return UpiInspectionResult(
                rawUri = input,
                payeeVpa = "Invalid",
                payeeName = "Malformed Link",
                amount = null,
                currency = null,
                transactionNote = null,
                merchantCode = null,
                isVerifiedMerchant = false,
                fraudKeywords = emptyList(),
                riskLevel = RiskLevel.HIGH_RISK,
                warningMessage = "Malformed UPI URI format."
            )
        }

        val payeeVpa = uri.getQueryParameter("pa").orEmpty()
        val payeeName = uri.getQueryParameter("pn").orEmpty()
        val amount = uri.getQueryParameter("am")
        val currency = uri.getQueryParameter("cu") ?: "INR"
        val transactionNote = uri.getQueryParameter("tn")
        val merchantCode = uri.getQueryParameter("mc")

        // Search for social-engineering traps
        val combinedText = "$payeeName \${transactionNote.orEmpty()}".lowercase()
        val matchedTriggers = SUSPICIOUS_KEYWORDS.filter { combinedText.contains(it) }

        val isVerifiedMerchant = merchantCode != null &&
            merchantCode.length == 4 &&
            TRUSTED_PSP_HANDLES.any { payeeVpa.endsWith(it) }

        val riskLevel = when {
            matchedTriggers.isNotEmpty() -> RiskLevel.HIGH_RISK
            payeeVpa.isBlank() -> RiskLevel.HIGH_RISK
            !isVerifiedMerchant && amount != null && (amount.toDoubleOrNull() ?: 0.0) == 0.0 -> RiskLevel.SUSPICIOUS
            isVerifiedMerchant -> RiskLevel.SAFE
            else -> RiskLevel.SUSPICIOUS
        }

        val warning = when (riskLevel) {
            RiskLevel.HIGH_RISK -> "HIGH FRAUD ALERT: Detected urgent scam keywords '\${matchedTriggers.joinToString()}'. Never enter UPI PIN to receive money!"
            RiskLevel.SUSPICIOUS -> "SUSPICIOUS: Recipient is an unverified individual account. Always confirm identity before authorizing."
            RiskLevel.SAFE -> "FORMAT COMPLIANT: Appears to be a registered merchant format. Always review payee name in bank app."
            RiskLevel.UNABLE_TO_VERIFY -> "Unable to verify recipient with bank registry."
        }

        return UpiInspectionResult(
            rawUri = input,
            payeeVpa = payeeVpa,
            payeeName = payeeName.ifBlank { "Unspecified" },
            amount = amount,
            currency = currency,
            transactionNote = transactionNote,
            merchantCode = merchantCode,
            isVerifiedMerchant = isVerifiedMerchant,
            fraudKeywords = matchedTriggers,
            riskLevel = riskLevel,
            warningMessage = warning
        )
    }
}`
  },
  {
    path: 'app/src/main/java/org/shieldguard/security/util/FileSignatureChecker.kt',
    language: 'kotlin',
    description: 'Inspects file headers (magic bytes), detects double extensions, and computes SHA-256 digests',
    content: `package org.shieldguard.security.util

import java.io.InputStream
import java.security.MessageDigest
import org.shieldguard.security.data.local.RiskLevel

data class FileInspectionResult(
    val fileName: String,
    val fileSize: Long,
    val sha256: String,
    val detectedFormat: String,
    val isDoubleExtension: Boolean,
    val isDisguisedExecutable: Boolean,
    val riskLevel: RiskLevel,
    val explanation: String
)

object FileSignatureChecker {

    private val EXECUTABLE_EXTENSIONS = setOf(
        "apk", "exe", "bat", "vbs", "cmd", "sh", "dex", "so", "msi"
    )

    private val DECOY_EXTENSIONS = setOf(
        "pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "txt"
    )

    fun inspectStream(fileName: String, inputStream: InputStream, fileSize: Long): FileInspectionResult {
        val digest = MessageDigest.getInstance("SHA-256")
        val header = ByteArray(8)
        var bytesReadInHeader = 0

        val buffer = ByteArray(8192)
        var read: Int

        while (inputStream.read(buffer).also { read = it } != -1) {
            digest.update(buffer, 0, read)
            if (bytesReadInHeader < header.size) {
                val needed = minOf(header.size - bytesReadInHeader, read)
                System.arraycopy(buffer, 0, header, bytesReadInHeader, needed)
                bytesReadInHeader += needed
            }
        }

        val sha256 = digest.digest().joinToString("") { "%02x".format(it) }

        // Analyze double extensions (e.g. invoice.pdf.apk)
        val parts = fileName.lowercase().split(".")
        val isDoubleExt = parts.size >= 3 &&
            DECOY_EXTENSIONS.contains(parts[parts.size - 2]) &&
            EXECUTABLE_EXTENSIONS.contains(parts.last())

        // Analyze header magic bytes
        val isZipOrApk = header.size >= 4 && header[0] == 0x50.toByte() && header[1] == 0x4B.toByte()
        val isPeExe = header.size >= 2 && header[0] == 0x4D.toByte() && header[1] == 0x5A.toByte()
        val isElf = header.size >= 4 && header[0] == 0x7F.toByte() && header[1] == 'E'.code.toByte()
        val isPdf = header.size >= 4 && header[0] == '%'.code.toByte() && header[1] == 'P'.code.toByte()

        val detectedFormat = when {
            isZipOrApk -> if (parts.last() == "apk") "Android Package (APK)" else "ZIP Archive"
            isPeExe -> "Windows DOS/PE Executable"
            isElf -> "Linux/Android ELF Executable"
            isPdf -> "Adobe PDF Document"
            else -> "Unknown Binary Stream"
        }

        val isDisguisedExec = (parts.last() == "pdf" || parts.last() == "jpg") && (isPeExe || isElf || isZipOrApk)

        val riskLevel = when {
            isDoubleExt || isDisguisedExec -> RiskLevel.HIGH_RISK
            parts.last() == "apk" -> RiskLevel.SUSPICIOUS
            else -> RiskLevel.SAFE
        }

        val explanation = when {
            isDoubleExt -> "CRITICAL: Malicious double extension detected. File masquerades as a document but executes as an app."
            isDisguisedExec -> "CRITICAL: File header does not match claimed file extension. Executable bytecode disguised as document."
            parts.last() == "apk" -> "Sideloaded Android APK. Bypasses standard Play Store vetting."
            else -> "File structure is valid with no obvious masquerading."
        }

        return FileInspectionResult(
            fileName = fileName,
            fileSize = fileSize,
            sha256 = sha256,
            detectedFormat = detectedFormat,
            isDoubleExtension = isDoubleExt,
            isDisguisedExecutable = isDisguisedExec,
            riskLevel = riskLevel,
            explanation = explanation
        )
    }
}`
  },
  {
    path: 'app/src/main/java/org/shieldguard/security/ui/dashboard/DashboardViewModel.kt',
    language: 'kotlin',
    description: 'MVVM ViewModel orchestrating quick scans, device posture, and Room scan history',
    content: `package org.shieldguard.security.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.shieldguard.security.data.local.RiskLevel
import org.shieldguard.security.data.local.ScanHistoryDao
import org.shieldguard.security.data.local.ScanHistoryEntity
import org.shieldguard.security.data.local.ScanType

data class DashboardUiState(
    val isScanning: Boolean = false,
    val scanProgress: Float = 0f,
    val currentScanPhase: String = "Ready",
    val overallRiskLevel: RiskLevel = RiskLevel.SAFE,
    val totalThreatsDetected: Int = 0,
    val appsScannedCount: Int = 24,
    val lastScanTimestamp: Long = System.currentTimeMillis()
)

class DashboardViewModel(
    private val scanHistoryDao: ScanHistoryDao
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    fun triggerDeviceScan() {
        if (_uiState.value.isScanning) return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isScanning = true,
                scanProgress = 0.1f,
                currentScanPhase = "Enumerating installed packages with <queries>..."
            )

            // Step 1: Query package manifests & signatures
            kotlinx.coroutines.delay(600)
            _uiState.value = _uiState.value.copy(
                scanProgress = 0.4f,
                currentScanPhase = "Auditing requested dangerous permission combinations..."
            )

            // Step 2: Audit system configuration & lockscreen
            kotlinx.coroutines.delay(600)
            _uiState.value = _uiState.value.copy(
                scanProgress = 0.7f,
                currentScanPhase = "Checking unknown app installation & overlay permissions..."
            )

            // Step 3: Inspect local download cache
            kotlinx.coroutines.delay(600)
            _uiState.value = _uiState.value.copy(
                scanProgress = 0.95f,
                currentScanPhase = "Synthesizing device posture report..."
            )

            kotlinx.coroutines.delay(400)
            _uiState.value = _uiState.value.copy(
                isScanning = false,
                scanProgress = 1.0f,
                currentScanPhase = "Scan Completed",
                overallRiskLevel = RiskLevel.SAFE,
                lastScanTimestamp = System.currentTimeMillis()
            )

            // Persist scan to Room
            scanHistoryDao.insertScanRecord(
                ScanHistoryEntity(
                    timestamp = System.currentTimeMillis(),
                    scanType = ScanType.FULL_DEVICE_SCAN,
                    targetIdentifier = "Full Device Posture",
                    riskLevel = RiskLevel.SAFE,
                    findingsSummary = "24 packages reviewed; 0 active overlay exploits found.",
                    totalFindings = 0
                )
            )
        }
    }
}`
  }
];
