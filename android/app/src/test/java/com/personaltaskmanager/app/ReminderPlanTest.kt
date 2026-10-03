package com.personaltaskmanager.app
import org.junit.Assert.*
import org.junit.Test
class ReminderPlanTest {
    @Test fun dailyHasElevenRemindersAndExcludesDeadline() {
        val times = ReminderPlan.future(0, 86400000, 2, 0)
        assertEquals(11, times.size)
        assertEquals(7200000L, times.first().second)
        assertEquals(79200000L, times.last().second)
    }
    @Test fun pastRemindersDoNotChangeStableIndexes() {
        val times = ReminderPlan.future(0, 86400000, 2, 7200000)
        assertEquals(2L, times.first().first)
        assertEquals(14400000L, times.first().second)
    }
    @Test fun futureStartAndExpiredTasks() {
        assertEquals(1L, ReminderPlan.future(10000000, 20000000, 1, 0).first().first)
        assertTrue(ReminderPlan.future(0, 7200000, 2, 7200000).isEmpty())
    }
    @Test(expected = IllegalArgumentException::class) fun rejectsExcessivePlan() {
        ReminderPlan.future(0, 86400000L * 5000, 1, 0)
    }
}
