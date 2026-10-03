package com.personaltaskmanager.app

/** Pure arithmetic shared by every native entry point and JVM tests. */
object ReminderPlan {
    fun future(start: Long, end: Long, intervalHours: Long, now: Long, max: Int = 10000): List<Pair<Long, Long>> {
        require(intervalHours > 0 && intervalHours <= 24) { "Intervalo inválido" }
        if (end <= start) return emptyList()
        val step = intervalHours * 3600000L
        val first = maxOf(1L, Math.floorDiv(now - start, step) + 1L)
        val fire = start + first * step
        val count = if (fire < end) (end - fire - 1) / step + 1 else 0
        require(count <= max) { "Reduce el plazo o aumenta el intervalo de recordatorios" }
        return (0 until count.toInt()).map { offset -> (first + offset) to (fire + offset * step) }
    }
}
